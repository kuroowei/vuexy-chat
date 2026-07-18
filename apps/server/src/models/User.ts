import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser } from '../types';

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+234')) {
    return cleaned;
  }
  if (cleaned.startsWith('234')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+234' + cleaned.slice(1);
  }
  if (/^\d{10}$/.test(cleaned)) {
    return '+234' + cleaned;
  }
  return cleaned;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\+234\d{10}$/, 'Please provide a valid Nigerian phone number'],
    },
    password: { type: String, required: true },
    avatar: { type: String, default: 'https://i.pravatar.cc/150?img=1' },
    status: { type: String, enum: ['online', 'offline', 'away', 'busy'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now },
    role: { type: String, default: 'user' },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    hiddenContacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

UserSchema.pre('validate', function (next) {
  if (this.isModified('phone') && this.phone) {
    this.phone = normalizePhoneNumber(this.phone);
  }
  next();
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);