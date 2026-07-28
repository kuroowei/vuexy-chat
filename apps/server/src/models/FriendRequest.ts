import mongoose, { Schema } from 'mongoose';
import type { IFriendRequest } from '../types';

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent sending a duplicate request to the same person twice
FriendRequestSchema.index({ senderId: 1, recipientId: 1 }, { unique: true });

export const FriendRequest = mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);