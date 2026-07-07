"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Multer configuration
const uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        const name = path_1.default.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'));
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        cb(new Error('File size must be less than 5MB'));
        return;
    }
    cb(null, true);
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
// Register route
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const user = await User_1.User.create({ name, email, password });
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'fallbacksecret', { expiresIn: '7d' });
        console.log('✅ User registered:', email);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
});
// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt:', email);
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({ message: 'Email and password required' });
        }
        const user = await User_1.User.findOne({ email });
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'fallbacksecret', { expiresIn: '7d' });
        console.log('✅ Login successful:', email);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
});
// Verify token route
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallbacksecret');
        const user = await User_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('❌ Verify token error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});
// Update profile route - supports both file upload and Base64
router.post('/update-profile', upload.single('profileImage'), async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallbacksecret');
        const { name, avatar } = req.body;
        let avatarUrl = avatar;
        if (req.file) {
            avatarUrl = `/uploads/${req.file.filename}`;
        }
        const user = await User_1.User.findByIdAndUpdate(decoded.userId, {
            ...(name && { name }),
            ...(avatarUrl && { avatar: avatarUrl }),
        }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('✅ Profile updated:', user.email);
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        console.error('❌ Profile update error:', error);
        if (error.message === 'Only image files are allowed') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message && error.message.includes('File size')) {
            return res.status(400).json({ message: 'File size must be less than 5MB' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});
// Forgot password route
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const resetToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallbacksecret', { expiresIn: '1h' });
        console.log('✅ Password reset email sent to:', email);
        res.json({ message: 'Password reset email sent', token: resetToken });
    }
    catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Reset password route
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallbacksecret');
        const user = await User_1.User.findByIdAndUpdate(decoded.userId, { password: newPassword }, { new: true });
        console.log('✅ Password reset successful:', user?.email);
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map