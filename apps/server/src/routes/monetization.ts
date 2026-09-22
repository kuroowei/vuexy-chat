import { Router, Response } from 'express';
import { Wallet } from '../models/Wallet';
import { VideoEarning } from '../models/VideoEarning';
import { Post } from '../models/Post';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculateVideoEarnings, MIN_ELIGIBLE_VIEWS } from '../services/monetizationService';

const router = Router();

router.use(authMiddleware);

router.get('/wallet', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }
    res.json({ balance: wallet.balance, totalEarned: wallet.totalEarned });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/earnings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const earnings = await VideoEarning.find({ userId })
      .sort({ periodEnd: -1 })
      .limit(100)
      .populate('postId', 'content videoUrl');

    res.json({
      earnings: earnings.map((e: any) => ({
        id: e._id.toString(),
        post: e.postId
          ? { id: e.postId._id.toString(), content: e.postId.content, videoUrl: e.postId.videoUrl }
          : null,
        viewsCounted: e.viewsCounted,
        amount: e.amount,
        periodStart: e.periodStart,
        periodEnd: e.periodEnd,
      })),
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/videos', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const posts = await Post.find({ authorId: userId, videoUrl: { $exists: true, $ne: null } }).sort({
      createdAt: -1,
    });

    res.json({
      videos: posts.map((p) => ({
        id: p._id.toString(),
        content: p.content,
        videoUrl: p.videoUrl,
        views: p.views,
        eligible: p.views >= MIN_ELIGIBLE_VIEWS,
        minEligibleViews: MIN_ELIGIBLE_VIEWS,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching monetization videos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/calculate-now', async (req: AuthRequest, res: Response) => {
  try {
    const result = await calculateVideoEarnings();
    res.json({ message: 'Earnings calculation complete', ...result });
  } catch (error) {
    console.error('Error running earnings calculation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
