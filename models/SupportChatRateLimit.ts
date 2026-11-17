import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISupportChatRateLimit extends Document {
  clientKey: string;
  windowStart: Date;
  count: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportChatRateLimitSchema = new Schema<ISupportChatRateLimit>(
  {
    clientKey: { type: String, required: true },
    windowStart: { type: Date, required: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

SupportChatRateLimitSchema.index({ clientKey: 1, windowStart: 1 }, { unique: true });
SupportChatRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SupportChatRateLimit: Model<ISupportChatRateLimit> =
  mongoose.models.SupportChatRateLimit ||
  mongoose.model<ISupportChatRateLimit>('SupportChatRateLimit', SupportChatRateLimitSchema);

export default SupportChatRateLimit;
