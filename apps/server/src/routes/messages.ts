import { Router, Response } from 'express';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Find an existing 1-on-1 conversation between the current user and
// contactId, or create one if it doesn't exist yet.
async function findOrCreateConversation(userId: string, contactId: string) {
  let conversation = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [userId, contactId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, contactId],
      lastMessage: '',
      lastMessageTime: new Date(),
      isGroup: false,
    });
  }

  return conversation;
}

const toMessageResponse = (message: any) => ({
  id: message._id.toString(),
  conversationId: message.conversationId.toString(),
  senderId: message.senderId.toString(),
  recipientId: message.recipientId.toString(),
  content: message.content,
  type: message.type,
  fileUrl: message.fileUrl,
  status: message.status,
  replyTo: message.replyTo ? message.replyTo.toString() : undefined,
  createdAt: message.createdAt,
});

// GET /api/messages/:contactId — fetch (or start) the conversation with
// a specific contact, and return its message history.
router.get('/:contactId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contactId } = req.params;

    if (contactId === userId) {
      return res.status(400).json({ message: 'Cannot open a conversation with yourself' });
    }

    const conversation = await findOrCreateConversation(userId, contactId);

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({
      conversationId: conversation._id.toString(),
      messages: messages.map(toMessageResponse),
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/:contactId — send a message (REST fallback / initial
// send). Real-time delivery to an online recipient happens via Socket.io
// in app.ts, which also persists the message the same way.
router.post('/:contactId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contactId } = req.params;
    const { content, type, fileUrl } = req.body;

    if (contactId === userId) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const conversation = await findOrCreateConversation(userId, contactId);

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: userId,
      recipientId: contactId,
      content,
      type: type || 'text',
      fileUrl,
      status: 'sent',
    });

    conversation.lastMessage = content;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    res.status(201).json({ message: toMessageResponse(message) });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// DELETE /api/messages/:contactId — clear all messages in this conversation
// (for both participants, since it's a shared conversation history).
router.delete('/:contactId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contactId } = req.params;

    const conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [userId, contactId], $size: 2 },
    });

    if (!conversation) {
      return res.json({ message: 'No conversation to clear' });
    }

    await Message.deleteMany({ conversationId: conversation._id });

    conversation.lastMessage = '';
    conversation.lastMessageTime = new Date();
    await conversation.save();

    res.json({ message: 'Conversation cleared' });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;