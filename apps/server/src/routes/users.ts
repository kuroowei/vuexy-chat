import { Router, Response } from 'express';
import { User } from '../models/User';
import { FriendRequest } from '../models/FriendRequest';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

const getCleanAvatar = (avatar: string | undefined): string => {
  if (!avatar || avatar.trim() === '') return '';
  if (avatar.includes('pravatar.cc')) return '';
  if (avatar.includes('i.pravatar.cc')) return '';
  return avatar;
};

export const toContactResponse = (user: any) => ({
  id: user._id.toString(),
  userId: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: getCleanAvatar(user.avatar),
  status: user.status,
  lastSeen: user.lastSeen,
});

// Get all "discoverable" users (for the Find People tab) — excludes yourself,
// anyone you've blocked or removed, and anyone who is already your friend
// (they belong in the Friends list instead). Each user is tagged with
// friendStatus so the frontend can show "Add Friend" / "Requested" / "Confirm".
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const currentUser = await User.findById(userId, 'blockedUsers hiddenContacts');
    const excludedIds = [
      ...(currentUser?.blockedUsers || []),
      ...(currentUser?.hiddenContacts || []),
    ].map((id: any) => id.toString());

    const relatedRequests = await FriendRequest.find({
      $or: [{ senderId: userId }, { recipientId: userId }],
    });

    const friendIds: string[] = [];
    const pendingSentIds: string[] = [];
    const pendingReceivedIds: string[] = [];

    relatedRequests.forEach((fr) => {
      const otherId = fr.senderId.toString() === userId ? fr.recipientId.toString() : fr.senderId.toString();
      if (fr.status === 'accepted') {
        friendIds.push(otherId);
      } else if (fr.senderId.toString() === userId) {
        pendingSentIds.push(otherId);
      } else {
        pendingReceivedIds.push(otherId);
      }
    });

    const users = await User.find(
      { _id: { $nin: [...excludedIds, ...friendIds, userId] } },
      '-password'
    ).sort({ createdAt: -1 });

    res.json({
      users: users.map((u) => {
        const id = u._id.toString();
        const friendStatus = pendingSentIds.includes(id)
          ? 'pending_sent'
          : pendingReceivedIds.includes(id)
          ? 'pending_received'
          : 'none';
        return { ...toContactResponse(u), friendStatus };
      }),
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