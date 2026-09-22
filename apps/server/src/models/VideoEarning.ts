import mongoose, { Schema } from 'mongoose';
import type { IVideoEarning } from '../types';

const VideoEarningSchema = new Schema<IVideoEarning>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    viewsCounted: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const VideoEarning = mongoose.model<IVideoEarning>('VideoEarning', VideoEarningSchema);
