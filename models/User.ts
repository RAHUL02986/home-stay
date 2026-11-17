// models/User.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'guest' | 'host' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  whatsappBookingOptIn: boolean;
  profileImage?: string;
  isVerified: boolean;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['guest', 'host', 'admin'], default: 'guest' },
    phone: { type: String, trim: true },
    whatsappBookingOptIn: { type: Boolean, default: false },
    profileImage: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
