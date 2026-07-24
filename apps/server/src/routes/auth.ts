import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const router = Router();

// Multer + Cloudinary configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'chat-app-avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  }),
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

// Extract the Cloudinary public_id from a stored avatar URL so we can delete it
const getPublicIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/chat-app-avatars\/([^./]+)\.[a-zA-Z]+$/);
  return match ? `chat-app-avatars/${match[1]}` : null;
};

const deleteOldAvatar = async (avatarUrl: string | undefined) => {
  if (!avatarUrl || !avatarUrl.startsWith('http')) return;
  const publicId = getPublicIdFromUrl(avatarUrl);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Failed to delete old Cloudinary avatar:', err);
    }
  }
};

// Helper to get full avatar URL
const getAvatarUrl = (avatarPath: string | undefined): string => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  const baseUrl = process.env.API_BASE_URL || '';
  return baseUrl + avatarPath;
};

// Helper to build a consistent user object for API responses
const toUserResponse = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: getAvatarUrl(user.avatar),
});

// Register route WITH avatar upload
router.post('/register', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    console.log('Register request body:', req.body);
    console.log('Register request file:', req.file);

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Missing required fields', received: req.body });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const avatarPath = req.file ? (req.file as any).path : '';

    let user;
    try {
      user = await User.create({
        name,
        email,
        phone,
        password,
        avatar: avatarPath,
      });
    } catch (err: any) {
      // Duplicate phone number (unique index violation)
      if (err.code === 11000 && err.keyPattern?.phone) {
        return res.status(400).json({ message: 'This phone number is already registered' });
      }
      // Any other validation error (e.g. bad phone format)
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallbacksecret',
      { expiresIn: '7d' }
    );

    console.log('User registered:', email);
    res.status(201).json({
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    console.error('Registration error:', error);
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
      user: toUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile with avatar (POST to match frontend AuthContext)
router.post('/update-profile', upload.single('avatar'), async (req: Request, res: Response) => {
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

    const { name, phone } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;

    if (req.file) {
      await deleteOldAvatar(user.avatar);
      user.avatar = (req.file as any).path;
    }

    try {
      await user.save();
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.phone) {
        return res.status(400).json({ message: 'This phone number is already in use by another account' });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }

    res.json({
      user: toUserResponse(user),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Also keep PUT /profile for backward compatibility
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

    const { name, phone } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;

    if (req.file) {
      await deleteOldAvatar(user.avatar);
      user.avatar = (req.file as any).path;
    }

    try {
      await user.save();
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.phone) {
        return res.status(400).json({ message: 'This phone number is already in use by another account' });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }

    res.json({
      user: toUserResponse(user),
    });
  } catch (error) {
    console.error('Profile update error:', error);
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
      user: toUserResponse(user),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;