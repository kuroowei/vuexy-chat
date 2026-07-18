import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  role: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  blockedUsers: Types.ObjectId[];
  hiddenContacts: Types.ObjectId[];
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

export interface ICall extends Document {
  callerId: Types.ObjectId;
  calleeId: Types.ObjectId;
  type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'declined' | 'missed' | 'ended';
  startedAt: Date;
  acceptedAt?: Date;
  endedAt?: Date;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}