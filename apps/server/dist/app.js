"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database_1 = require("./config/database");
const auth_1 = __importDefault(require("./routes/auth"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
    },
});
(0, database_1.connectDB)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use('/api/auth', auth_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token)
            throw new Error('No token');
        const jwt = await Promise.resolve().then(() => __importStar(require('jsonwebtoken')));
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret');
        socket.data.userId = decoded.userId;
        next();
    }
    catch (err) {
        next(new Error('Authentication error'));
    }
});
const userSockets = new Map();
io.on('connection', (socket) => {
    const userId = socket.data.userId;
    userSockets.set(userId, socket.id);
    console.log('User connected: ' + userId);
    socket.on('join_conversation', (conversationId) => {
        socket.join('conversation:' + conversationId);
    });
    socket.on('leave_conversation', (conversationId) => {
        socket.leave('conversation:' + conversationId);
    });
    socket.on('typing', ({ contactId, isTyping }) => {
        socket.to('user:' + contactId).emit('typing', { userId, isTyping });
    });
    socket.on('send_message', async (data) => {
        socket.to('conversation:' + data.conversationId).emit('new_message', data);
    });
    socket.on('disconnect', async () => {
        userSockets.delete(userId);
        console.log('User disconnected: ' + userId);
    });
});
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
//# sourceMappingURL=app.js.map