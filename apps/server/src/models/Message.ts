import mongoose, { Schema } from 'mongoose';
import type { IMessage } from '../types';

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'file', 'audio'], default: 'text' },
    fileUrl: { type: String },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, recipientId: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
