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

  socket.on('disconnect', async () => {
    userSockets.delete(userId);
    console.log('User disconnected: ' + userId);
  });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
