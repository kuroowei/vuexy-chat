import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import callRoutes from './routes/calls';
import { User } from './models/User';
import { Call } from './models/Call';

const app = express();
const httpServer = createServer(app);

const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL || '',
].filter((origin): origin is string => !!origin);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

connectDB();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static('public/uploads'));
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calls', callRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Vuexy Chat API', status: 'running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('No token');

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret') as any;
    socket.data.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Maps a userId to their currently connected socket id.
// NOTE: this only supports one active connection per user at a time —
// if the same account is open in two tabs/devices, only the most recent
// connection will receive call/message events. Fine for now, worth
// revisiting later if multi-device support becomes a requirement.
const userSockets = new Map<string, string>();

// Tracks calls currently ringing, so we can mark them "missed" if the
// callee disconnects (closes tab, loses connection) before answering.
const ringingCallsByCallee = new Map<string, string>(); // calleeUserId -> callId

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  userSockets.set(userId, socket.id);

  console.log('User connected: ' + userId);

  socket.on('join_conversation', (conversationId: string) => {
    socket.join('conversation:' + conversationId);
  });

  socket.on('leave_conversation', (conversationId: string) => {
    socket.leave('conversation:' + conversationId);
  });

  socket.on('typing', ({ contactId, isTyping }: any) => {
    socket.to('user:' + contactId).emit('typing', { userId, isTyping });
  });

  socket.on('send_message', async (data: any) => {
    socket.to('conversation:' + data.conversationId).emit('new_message', data);
  });

  // ---- Call signaling ----

  socket.on('call:invite', async ({ calleeId, type }: { calleeId: string; type: 'audio' | 'video' }) => {
    try {
      const caller = await User.findById(userId, 'name avatar');
      if (!caller) return;

      const call = await Call.create({
        callerId: userId,
        calleeId,
        type,
        status: 'ringing',
        startedAt: new Date(),
      });

      const calleeSocketId = userSockets.get(calleeId);
      if (!calleeSocketId) {
        call.status = 'missed';
        call.endedAt = new Date();
        await call.save();
        socket.emit('call:unavailable', { callId: call._id.toString() });
        return;
      }

      ringingCallsByCallee.set(calleeId, call._id.toString());

      io.to(calleeSocketId).emit('call:incoming', {
        callId: call._id.toString(),
        callerId: userId,
        callerName: caller.name,
        callerAvatar: caller.avatar,
        type,
      });

      socket.emit('call:ringing', { callId: call._id.toString() });
    } catch (err) {
      console.error('call:invite error:', err);
    }
  });

  socket.on('call:accept', async ({ callId }: { callId: string }) => {
    try {
      const call = await Call.findById(callId);
      if (!call) return;

      call.status = 'accepted';
      call.acceptedAt = new Date();
      await call.save();

      ringingCallsByCallee.delete(call.calleeId.toString());

      const callerSocketId = userSockets.get(call.callerId.toString());
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:accepted', { callId });
      }
    } catch (err) {
      console.error('call:accept error:', err);
    }
  });

  socket.on('call:decline', async ({ callId }: { callId: string }) => {
    try {
      const call = await Call.findById(callId);
      if (!call) return;

      call.status = 'declined';
      call.endedAt = new Date();
      await call.save();

      ringingCallsByCallee.delete(call.calleeId.toString());

      const callerSocketId = userSockets.get(call.callerId.toString());
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:declined', { callId });
      }
    } catch (err) {
      console.error('call:decline error:', err);
    }
  });

  socket.on('call:end', async ({ callId }: { callId: string }) => {
    try {
      const call = await Call.findById(callId);
      if (!call) return;

      const wasRinging = call.status === 'ringing';
      call.endedAt = new Date();

      if (wasRinging) {
        call.status = 'missed';
      } else if (call.status === 'accepted') {
        call.status = 'ended';
        if (call.acceptedAt) {
          call.duration = Math.round((call.endedAt.getTime() - call.acceptedAt.getTime()) / 1000);
        }
      }

      await call.save();
      ringingCallsByCallee.delete(call.calleeId.toString());

      const otherPartyId =
        call.callerId.toString() === userId ? call.calleeId.toString() : call.callerId.toString();
      const otherSocketId = userSockets.get(otherPartyId);
      if (otherSocketId) {
        io.to(otherSocketId).emit('call:ended', { callId });
      }
    } catch (err) {
      console.error('call:end error:', err);
    }
  });

  // ---- WebRTC signaling relay (server never touches the media itself) ----

  socket.on('webrtc:offer', ({ targetUserId, offer }: any) => {
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:offer', { fromUserId: userId, offer });
    }
  });

  socket.on('webrtc:answer', ({ targetUserId, answer }: any) => {
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:answer', { fromUserId: userId, answer });
    }
  });

  socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }: any) => {
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:ice-candidate', { fromUserId: userId, candidate });
    }
  });

  socket.on('disconnect', async () => {
    userSockets.delete(userId);

    const pendingCallId = ringingCallsByCallee.get(userId);
    if (pendingCallId) {
      try {
        const call = await Call.findById(pendingCallId);
        if (call && call.status === 'ringing') {
          call.status = 'missed';
          call.endedAt = new Date();
          await call.save();

          const callerSocketId = userSockets.get(call.callerId.toString());
          if (callerSocketId) {
            io.to(callerSocketId).emit('call:ended', { callId: pendingCallId });
          }
        }
      } catch (err) {
        console.error('Error marking call missed on disconnect:', err);
      }
      ringingCallsByCallee.delete(userId);
    }

    console.log('User disconnected: ' + userId);
  });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});