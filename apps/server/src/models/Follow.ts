import mongoose, { Schema } from 'mongoose';
import type { IFollow } from '../types';

const FollowSchema = new Schema<IFollow>(
  {
    followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent following the same person twice, and speed up lookups both ways
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1 });

export const Follow = mongoose.model<IFollow>('Follow', FollowSchema);