import { Router, Response } from 'express';
import { Follow } from '../models/Follow';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { toContactResponse } from './users';

const router = Router();

router.use(authMiddleware);

// POST /api/follows/:userId — follow someone
router.post('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const targetId = req.params.userId;

    if (targetId === userId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const existing = await Follow.findOne({ followerId: userId, followingId: targetId });
    if (existing) {
      return res.status(400).json({ message: 'Already following this person' });
    }

    await Follow.create({ followerId: userId, followingId: targetId });
    res.status(201).json({ message: 'Now following' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/follows/:userId — unfollow someone
router.delete('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const targetId = req.params.userId;

    await Follow.deleteOne({ followerId: userId, followingId: targetId });
    res.json({ message: 'Unfollowed' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/follows/:userId/summary — follower/following counts + whether I follow them
router.get('/:userId/summary', async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const targetId = req.params.userId;

    const [followerCount, followingCount, iFollowThem, theyFollowMe] = await Promise.all([
      Follow.countDocuments({ followingId: targetId }),
      Follow.countDocuments({ followerId: targetId }),
      Follow.exists({ followerId: currentUserId, followingId: targetId }),
      Follow.exists({ followerId: targetId, followingId: currentUserId }),
    ]);

    res.json({
      followerCount,
      followingCount,
      isFollowedByMe: !!iFollowThem,
      followsMe: !!theyFollowMe,
    });
  } catch (error) {
    console.error('Error fetching follow summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/follows/:userId/followers — list of people following this user
router.get('/:userId/followers', async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params.userId;
    const follows = await Follow.find({ followingId: targetId }).populate(
      'followerId',
      'name avatar status lastSeen'
    );
    res.json({ users: follows.map((f: any) => toContactResponse(f.followerId)) });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/follows/:userId/following — list of people this user follows
router.get('/:userId/following', async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params.userId;
    const follows = await Follow.find({ followerId: targetId }).populate(
      'followingId',
      'name avatar status lastSeen'
    );
    res.json({ users: follows.map((f: any) => toContactResponse(f.followingId)) });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;