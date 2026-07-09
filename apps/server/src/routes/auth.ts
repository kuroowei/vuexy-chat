import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer configuration
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Helper to get full avatar URL
const getAvatarUrl = (avatarPath: string | undefined): string => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  const baseUrl = process.env.API_BASE_URL || '';
  return baseUrl + avatarPath;
};

// Register route WITH avatar upload
router.post('/register', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const avatarPath = req.file ? `/uploads/${req.file.filename}` : '';

    const user = await User.create({
      name,
      email,
      password,
      avatar: avatarPath,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallbacksecret',
      { expiresIn: '7d' }
    );

    console.log('? User registered:', email);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: getAvatarUrl(user.avatar),
      },
    });
  } catch (error) {
    console.error('? Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallbacksecret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: getAvatarUrl(user.avatar),
      },
    });
  } catch (error) {
    console.error('? Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile with avatar
router.put('/profile', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret') as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name } = req.body;
    if (name) user.name = name;

    if (req.file) {
      // Delete old avatar if exists
      if (user.avatar && !user.avatar.startsWith('http')) {
        const oldPath = path.join(uploadDir, path.basename(user.avatar));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: getAvatarUrl(user.avatar),
      },
    });
  } catch (error) {
    console.error('? Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret') as any;
    const user = await User.findById(decoded.userId, '-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: getAvatarUrl(user.avatar),
      },
    });
  } catch (error) {
    console.error('? Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
