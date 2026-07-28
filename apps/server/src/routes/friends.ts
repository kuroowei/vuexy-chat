import { Router, Response } from 'express';
import { FriendRequest } from '../models/FriendRequest';
import { User } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { toContactResponse } from './users';

const router = Router();

router.use(authMiddleware);

// GET /api/friends — accepted friends only (this is what the Chat/Contacts
// list should show from now on, instead of every registered user).
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const currentUser = await User.findById(userId, 'blockedUsers hiddenContacts');
    const excludedIds = [
      ...(currentUser?.blockedUsers || []),
      ...(currentUser?.hiddenContacts || []),
    ].map((id: any) => id.toString());

    const accepted = await FriendRequest.find({
      status: 'accepted',
      $or: [{ senderId: userId }, { recipientId: userId }],
    });

    const friendIds = accepted
      .map((fr) => (fr.senderId.toString() === userId ? fr.recipientId.toString() : fr.senderId.toString()))
      .filter((id) => !excludedIds.includes(id));

    const users = await User.find({ _id: { $in: friendIds } }, '-password');

    res.json({ users: users.map(toContactResponse) });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/friends/requests — incoming pending requests, for the "Requests" tab
router.get('/requests', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const requests = await FriendRequest.find({ recipientId: userId, status: 'pending' }).populate(
      'senderId',
      'name phone avatar status lastSeen'
    );

    res.json({
      requests: requests.map((r: any) => ({
        id: r._id.toString(),
        user: toContactResponse(r.senderId),
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/friends/sent — outgoing pending requests (so "Find People" can
// show "Requested" instead of "Add Friend" for people you've already asked)
router.get('/sent', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const requests = await FriendRequest.find({ senderId: userId, status: 'pending' });
    res.json({ recipientIds: requests.map((r) => r.recipientId.toString()) });
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/request/:userId — send a friend request. If the target
// user already sent YOU a request, this accepts theirs instead of creating
// a duplicate (same as most social apps handle a "mutual" request).
router.post('/request/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const targetId = req.params.userId;

    if (targetId === userId) {
      return res.status(400).json({ message: 'You cannot send yourself a friend request' });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { senderId: userId, recipientId: targetId },
        { senderId: targetId, recipientId: userId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends' });
      }
      if (existing.senderId.toString() === targetId) {
        existing.status = 'accepted';
        existing.respondedAt = new Date();
        await existing.save();
        return res.json({ message: 'Friend request accepted', status: 'accepted' });
      }
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    await FriendRequest.create({ senderId: userId, recipientId: targetId, status: 'pending' });
    res.status(201).json({ message: 'Friend request sent', status: 'pending' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/accept/:requestId
router.post('/accept/:requestId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request || request.recipientId.toString() !== userId) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/decline/:requestId
router.post('/decline/:requestId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request || request.recipientId.toString() !== userId) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    await request.deleteOne();
    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/friends/:userId — unfriend someone
router.delete('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const targetId = req.params.userId;

    await FriendRequest.deleteOne({
      status: 'accepted',
      $or: [
        { senderId: userId, recipientId: targetId },
        { senderId: targetId, recipientId: userId },
      ],
    });

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;