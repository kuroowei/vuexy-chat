import mongoose, { Schema } from 'mongoose';
import type { ICall } from '../types';

const CallSchema = new Schema<ICall>(
  {
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    calleeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['audio', 'video'], required: true },
    status: {
      type: String,
      enum: ['ringing', 'accepted', 'declined', 'missed', 'ended'],
      default: 'ringing',
    },
    startedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 }, // seconds, computed on call end
  },
  { timestamps: true }
);

// Fast lookups for "my call history" queries
CallSchema.index({ callerId: 1, createdAt: -1 });
CallSchema.index({ calleeId: 1, createdAt: -1 });

export const Call = mongoose.model<ICall>('Call', CallSchema);