import { Router, Response } from 'express';
import { User } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

const getCleanAvatar = (avatar: string | undefined): string => {
  if (!avatar || avatar.trim() === '') return '';
  if (avatar.includes('pravatar.cc')) return '';
  if (avatar.includes('i.pravatar.cc')) return '';
  return avatar;
};

const toContactResponse = (user: any) => ({
  id: user._id.toString(),
  userId: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: getCleanAvatar(user.avatar),
  status: user.status,
  lastSeen: user.lastSeen,
});

// Get all users (for contacts list) — excludes anyone the current user
// has blocked or removed from their contact list.
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = await User.findById(req.user!.userId, 'blockedUsers hiddenContacts');
    const excludedIds = [
      ...(currentUser?.blockedUsers || []),
      ...(currentUser?.hiddenContacts || []),
    ];

    const users = await User.find(
      { _id: { $nin: excludedIds } },
      '-password'
    ).sort({ createdAt: -1 });

    res.json({
      users: users.map(toContactResponse),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get the current user's blocked contacts list.
// IMPORTANT: this must be defined BEFORE the '/:id' route below,
// otherwise Express would treat "blocked" as an :id value.
router.get('/blocked', async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = await User.findById(req.user!.userId).populate(
      'blockedUsers',
      'name phone avatar status lastSeen'
    );

    const blocked = (currentUser?.blockedUsers || []).map((user: any) =>
      toContactResponse(user)
    );

    res.json({ blocked });
  } catch (error) {
    console.error('Error fetching blocked contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user by ID (for "View Profile")
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(toContactResponse(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block a contact — removes them from view and prevents them showing up again
router.post('/:id/block', async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user!.userId) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    await User.findByIdAndUpdate(req.user!.userId, {
      $addToSet: { blockedUsers: targetId },
    });

    res.json({ message: 'Contact blocked' });
  } catch (error) {
    console.error('Error blocking contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock a previously blocked contact
router.post('/:id/unblock', async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params.id;

    await User.findByIdAndUpdate(req.user!.userId, {
      $pull: { blockedUsers: targetId },
    });

    res.json({ message: 'Contact unblocked' });
  } catch (error) {
    console.error('Error unblocking contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// "Delete contact" — hides them from the current user's contact list only.
// Does NOT delete the other person's account; fully reversible in principle.
router.post('/:id/hide', async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user!.userId) {
      return res.status(400).json({ message: 'You cannot remove yourself' });
    }

    await User.findByIdAndUpdate(req.user!.userId, {
      $addToSet: { hiddenContacts: targetId },
    });

    res.json({ message: 'Contact removed' });
  } catch (error) {
    console.error('Error hiding contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;