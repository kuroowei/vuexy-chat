import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  role: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio';
  fileUrl?: string;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: Map<string, number>;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdAt: Date;
}
