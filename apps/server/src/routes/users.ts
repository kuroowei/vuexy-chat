import { Router, Request, Response } from 'express';
import { User } from '../models/User';

const router = Router();

// Get all users (for contacts list)
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({
      users: users.map(user => ({
        id: user._id.toString(),
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        status: user.status,
        lastSeen: user.lastSeen,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      status: user.status,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
