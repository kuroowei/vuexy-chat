import type { Agenda } from 'agenda';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { AIAgentSettings } from '../models/AIAgentSettings';
import { generateAgentReply, AgentHistoryItem } from '../config/gemini';
import type { IMessage } from '../types';

const LOOP_PROTECTION_CAP = 3;
const HISTORY_LIMIT = 15;

export async function scheduleAgentReplyIfNeeded(agenda: Agenda, message: IMessage) {
  const recipientId = message.recipientId.toString();
  const senderId = message.senderId.toString();

  const settings = await AIAgentSettings.findOne({ userId: recipientId });
  if (!settings || !settings.enabled) return;

  const isExcluded = settings.excludedContactIds.some((id) => id.toString() === senderId);
  if (isExcluded) return;

  const conversation = await Conversation.findById(message.conversationId);
  if (!conversation || conversation.aiLoopPaused) return;

  const now = new Date();
  if (now.toDateString() !== settings.lastReplyCountReset.toDateString()) {
    settings.repliesSentToday = 0;
    settings.lastReplyCountReset = now;
    await settings.save({ validateModifiedOnly: true });
  }
  if (settings.repliesSentToday >= settings.dailyReplyLimit) return;

  await agenda.now('generate-ai-reply', {
    conversationId: message.conversationId.toString(),
    triggeringMessageId: (message._id as any).toString(),
    senderId,
    recipientId,
  });
}

interface AgentJobData {
  conversationId: string;
  triggeringMessageId: string;
  senderId: string;
  recipientId: string;
}

export async function processAgentReply(
  data: AgentJobData,
  emitToUser: (userId: string, event: string, payload: any) => void,
  isUserOnline: (userId: string) => boolean,
  agenda: Agenda
) {
  const { conversationId, senderId, recipientId } = data;

  const settings = await AIAgentSettings.findOne({ userId: recipientId });
  if (!settings || !settings.enabled) return;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.aiLoopPaused) return;

  const triggeringMessage = await Message.findById(data.triggeringMessageId);
  if (!triggeringMessage) return;

  const recentMessages = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT + 1)
    .then((msgs) => msgs.reverse());

  const history: AgentHistoryItem[] = recentMessages
    .filter((m) => (m._id as any).toString() !== data.triggeringMessageId)
    .map((m) => ({
      role: m.senderId.toString() === recipientId ? 'agent-owner' : 'other-person',
      content: m.content,
    }));

  const replyText = await generateAgentReply(settings.persona, history, triggeringMessage.content);

  const aiMessage = await Message.create({
    conversationId,
    senderId: recipientId,
    recipientId: senderId,
    content: replyText,
    type: 'text',
    status: 'sent',
    isAiGenerated: true,
  });

  conversation.lastMessage = replyText;
  conversation.lastMessageTime = new Date();
  conversation.consecutiveAiReplies += 1;
  if (conversation.consecutiveAiReplies >= LOOP_PROTECTION_CAP) {
    conversation.aiLoopPaused = true;
  }
  await conversation.save();

  settings.repliesSentToday += 1;
  await settings.save({ validateModifiedOnly: true });

  const payload = {
    id: (aiMessage._id as any).toString(),
    conversationId,
    senderId: recipientId,
    recipientId: senderId,
    content: replyText,
    type: 'text',
    status: 'sent',
    isAiGenerated: true,
    createdAt: aiMessage.createdAt,
  };
  emitToUser(senderId, 'new_message', payload);
  emitToUser(recipientId, 'new_message', payload);

  if (!conversation.aiLoopPaused && !isUserOnline(senderId)) {
    await scheduleAgentReplyIfNeeded(agenda, aiMessage);
  }
}
