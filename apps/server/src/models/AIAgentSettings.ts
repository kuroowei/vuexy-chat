import mongoose, { Schema } from 'mongoose';
import type { IAIAgentSettings } from '../types';

const AIAgentSettingsSchema = new Schema<IAIAgentSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    persona: { type: String, default: '' },
    excludedContactIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dailyReplyLimit: { type: Number, default: 50 },
    repliesSentToday: { type: Number, default: 0 },
    lastReplyCountReset: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AIAgentSettings = mongoose.model<IAIAgentSettings>('AIAgentSettings', AIAgentSettingsSchema);
