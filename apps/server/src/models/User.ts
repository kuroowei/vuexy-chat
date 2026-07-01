import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser } from '../types';

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String, default: 'https://i.pravatar.cc/150?img=1' },
    status: { type: String, enum: ['online', 'offline', 'away', 'busy'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now },
    role: { type: String, default: 'user' },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
