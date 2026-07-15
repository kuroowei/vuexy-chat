import { Router, Response } from 'express';
import { Call } from '../models/Call';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All call routes require a logged-in user — call history is private.
router.use(authMiddleware);

// Helper to shape a populated call document into the API response format
const toCallResponse = (call: any, currentUserId: string) => {
  const isCaller = call.callerId._id.toString() === currentUserId;
  const otherParty = isCaller ? call.calleeId : call.callerId;

  return {
    id: call._id.toString(),
    contactId: otherParty._id.toString(),
    contactName: otherParty.name,
    contactAvatar: otherParty.avatar,
    direction: isCaller ? 'outgoing' : 'incoming',
    type: call.type,
    status: call.status,
    startedAt: call.startedAt,
    acceptedAt: call.acceptedAt,
    endedAt: call.endedAt,
    duration: call.duration,
  };
};

// GET /api/calls — full call history for the logged-in user
// GET /api/calls?filter=missed — only missed calls
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { filter } = req.query;

    const query: any = {
      $or: [{ callerId: userId }, { calleeId: userId }],
    };

    if (filter === 'missed') {
      query.status = 'missed';
    }

    const calls = await Call.find(query)
      .populate('callerId', 'name avatar')
      .populate('calleeId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      calls: calls.map((call) => toCallResponse(call, userId)),
    });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;