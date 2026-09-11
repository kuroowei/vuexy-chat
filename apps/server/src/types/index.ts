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

export interface IMessageReaction {
  userId: Types.ObjectId;
  emoji: string;
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
  deletedFor: Types.ObjectId[];
  reactions: IMessageReaction[];
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

export interface IFriendRequest extends Document {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  status: 'pending' | 'accepted';
  createdAt: Date;
  respondedAt?: Date;
}

export interface IPostComment {
  authorId: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  authorId: Types.ObjectId;
  content: string;
  imageUrl?: string;
  likes: Types.ObjectId[];
  comments: IPostComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IFollow extends Document {
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt: Date;
}