import mongoose, { Schema } from 'mongoose';
import type { IPostView } from '../types';

const PostViewSchema = new Schema<IPostView>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    viewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One counted view per viewer per video, ever — the simplest, hardest-to-game rule.
PostViewSchema.index({ postId: 1, viewerId: 1 }, { unique: true });

export const PostView = mongoose.model<IPostView>('PostView', PostViewSchema);
