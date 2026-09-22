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
import messageRoutes from './routes/messages';
import friendRoutes from './routes/friends';
import postRoutes from './routes/posts';
import followRoutes from './routes/follows';
import aiAgentRoutes from './routes/aiAgent';
import monetizationRoutes from './routes/monetization';
import { User } from './models/User';
import { Call } from './models/Call';
import { Message } from './models/Message';
import { Conversation } from './models/Conversation';
import { agenda, defineAgentJobs, defineMonetizationJob, startAgenda } from './config/agenda';
import { scheduleAgentReplyIfNeeded } from './services/aiAgentService';

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
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/ai-agent', aiAgentRoutes);
app.use('/api/monetization', monetizationRoutes);

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

const userSockets = new Map<string, string>();
const ringingCallsByCallee = new Map<string, string>();

// Small helpers the AI Agent background worker uses to reach connected
// sockets without needing to know about Socket.io's internals directly.
function emitToUser(targetUserId: string, event: string, payload: any) {
  const socketId = userSockets.get(targetUserId);
  if (socketId) {
    io.to(socketId).emit(event, payload);
  }
}
function isUserOnline(targetUserId: string): boolean {
  return userSockets.has(targetUserId);
}

defineAgentJobs(emitToUser, isUserOnline);
defineMonetizationJob();
startAgenda().catch((err) => console.error('Failed to start Agenda:', err));

async function findOrCreateConversation(userId: string, contactId: string) {
  let conversation = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [userId, contactId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, contactId],
      lastMessage: '',
      lastMessageTime: new Date(),
      isGroup: false,
    });
  }

  return conversation;
}

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  userSockets.set(userId, socket.id);

  console.log('User connected: ' + userId);

  // Mark this user online and let everyone else know in real time
  User.findByIdAndUpdate(userId, { status: 'online' })
    .then(() => {
      io.emit('user:status', { userId, status: 'online' });
    })
    .catch((err) => console.error('Error setting user online:', err));

  socket.on('join_conversation', (conversationId: string) => {
    socket.join('conversation:' + conversationId);
  });

  socket.on('leave_conversation', (conversationId: string) => {
    socket.leave('conversation:' + conversationId);
  });

  socket.on('typing', ({ contactId, isTyping }: any) => {
    const targetSocketId = userSockets.get(contactId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('typing', { userId, isTyping });
    }
  });

  socket.on('voice_recording', ({ contactId, isRecording }: any) => {
    const targetSocketId = userSockets.get(contactId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('voice_recording', { userId, isRecording });
    }
  });

  socket.on('delete_message', async ({ messageId }: { messageId: string }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
      if (message.senderId.toString() !== userId) return; // only the sender can delete

      const recipientId = message.recipientId.toString();
      await message.deleteOne();

      socket.emit('message_deleted', { messageId });
      const recipientSocketId = userSockets.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message_deleted', { messageId });
      }
    } catch (err) {
      console.error('delete_message error:', err);
    }
  });

  socket.on('delete_message_for_me', async ({ messageId }: { messageId: string }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      // Only the sender or recipient of this specific message may hide it
      const isParticipant =
        message.senderId.toString() === userId || message.recipientId.toString() === userId;
      if (!isParticipant) return;

      await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: userId } });

      // Only the requesting user's own view changes — no need to notify the other party
      socket.emit('message_deleted', { messageId });
    } catch (err) {
      console.error('delete_message_for_me error:', err);
    }
  });

  socket.on('react_to_message', async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const isParticipant =
        message.senderId.toString() === userId || message.recipientId.toString() === userId;
      if (!isParticipant) return;

      const existingIndex = message.reactions.findIndex((r: any) => r.userId.toString() === userId);

      if (existingIndex !== -1 && message.reactions[existingIndex].emoji === emoji) {
        // Tapping the same emoji again removes it
        message.reactions.splice(existingIndex, 1);
      } else if (existingIndex !== -1) {
        // Switching to a different emoji replaces the old one
        message.reactions[existingIndex].emoji = emoji;
      } else {
        message.reactions.push({ userId, emoji } as any);
      }

      await message.save();

      const payload = { messageId, reactions: message.reactions };
      socket.emit('message_reaction_updated', payload);
      const otherUserId =
        message.senderId.toString() === userId ? message.recipientId.toString() : message.senderId.toString();
      const otherSocketId = userSockets.get(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit('message_reaction_updated', payload);
      }
    } catch (err) {
      console.error('react_to_message error:', err);
    }
  });

  socket.on('send_message', async (data: any) => {
    try {
      const { recipientId, content, type, fileUrl } = data;
      if (!recipientId || !content || !content.trim()) return;

      const conversation = await findOrCreateConversation(userId, recipientId);

      const message = await Message.create({
        conversationId: conversation._id,
        senderId: userId,
        recipientId,
        content,
        type: type || 'text',
        fileUrl,
        status: 'sent',
      });

      conversation.lastMessage = content;
      conversation.lastMessageTime = new Date();
      // A real human just sent a message in this conversation — clear any
      // AI-to-AI loop guard so the Agent(s) can engage normally again.
      if (conversation.consecutiveAiReplies > 0 || conversation.aiLoopPaused) {
        conversation.consecutiveAiReplies = 0;
        conversation.aiLoopPaused = false;
      }
      await conversation.save();

      const messagePayload = {
        id: message._id.toString(),
        conversationId: conversation._id.toString(),
        senderId: userId,
        recipientId,
        content,
        type: message.type,
        fileUrl: message.fileUrl,
        status: message.status,
        isAiGenerated: false,
        createdAt: message.createdAt,
      };

      socket.emit('new_message', messagePayload);
      const recipientSocketId = userSockets.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new_message', messagePayload);
      } else {
        // Recipient is offline — let their AI Agent decide whether to step in.
        scheduleAgentReplyIfNeeded(agenda, message).catch((err) =>
          console.error('scheduleAgentReplyIfNeeded error:', err)
        );
      }
    } catch (err) {
      console.error('send_message error:', err);
    }
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
        io.emit('call:unavailable', { callId: call._id.toString() });
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
      console.log('[Call] Received call:accept for callId:', callId, 'from user:', userId);
      const call = await Call.findById(callId);
      if (!call) {
        console.log('[Call] No Call document found for callId:', callId);
        return;
      }

      call.status = 'accepted';
      call.acceptedAt = new Date();
      await call.save();

      ringingCallsByCallee.delete(call.calleeId.toString());

      const callerSocketId = userSockets.get(call.callerId.toString());
      console.log('[Call] Looking up caller socket for callerId:', call.callerId.toString(), '-> found:', callerSocketId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:accepted', { callId });
        console.log('[Call] Emitted call:accepted to socket:', callerSocketId);
      } else {
        console.log('[Call] Caller socket not found in userSockets map — cannot relay call:accepted');
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

    // Mark this user offline and record when they were last seen
    try {
      await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
      io.emit('user:status', { userId, status: 'offline' });
    } catch (err) {
      console.error('Error setting user offline:', err);
    }

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