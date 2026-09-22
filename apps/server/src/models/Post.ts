import mongoose, { Schema } from 'mongoose';
import type { IPost } from '../types';

const PostCommentSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const PostSchema = new Schema<IPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true, maxlength: 5000, default: '' },
    imageUrl: { type: String },
    videoUrl: { type: String },
    views: { type: Number, default: 0 },
    lastEarningsCalculatedViews: { type: Number, default: 0 },
    lastEarningsCalculatedAt: { type: Date, default: Date.now },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [PostCommentSchema],
  },
  { timestamps: true }
);

// Feed is always sorted newest-first
PostSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);