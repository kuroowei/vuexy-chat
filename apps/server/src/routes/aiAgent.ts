import { Router, Response } from 'express';
import { AIAgentSettings } from '../models/AIAgentSettings';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

const toSettingsResponse = (settings: any) => ({
  enabled: settings.enabled,
  persona: settings.persona,
  excludedContactIds: settings.excludedContactIds.map((id: any) => id.toString()),
  dailyReplyLimit: settings.dailyReplyLimit,
  repliesSentToday: settings.repliesSentToday,
});

router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    let settings = await AIAgentSettings.findOne({ userId });
    if (!settings) {
      settings = await AIAgentSettings.create({ userId });
    }
    res.json(toSettingsResponse(settings));
  } catch (error) {
    console.error('Get AI agent settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { enabled, persona, excludedContactIds, dailyReplyLimit } = req.body;

    let settings = await AIAgentSettings.findOne({ userId });
    if (!settings) {
      settings = new AIAgentSettings({ userId });
    }

    if (typeof enabled === 'boolean') settings.enabled = enabled;
    if (typeof persona === 'string') settings.persona = persona.slice(0, 1000);
    if (Array.isArray(excludedContactIds)) settings.excludedContactIds = excludedContactIds;
    if (typeof dailyReplyLimit === 'number' && dailyReplyLimit > 0 && dailyReplyLimit <= 500) {
      settings.dailyReplyLimit = dailyReplyLimit;
    }

    await settings.save({ validateModifiedOnly: true });
    res.json(toSettingsResponse(settings));
  } catch (error) {
    console.error('Update AI agent settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
