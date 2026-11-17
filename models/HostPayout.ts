// models/HostPayout.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type PayoutStatus = 'pending' | 'processed' | 'failed';

export interface IHostPayout extends Document {
  host: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  amount: number; // amount payable to host after commission
  commission: number; // platform commission amount
  status: PayoutStatus;
  paidAt?: Date;
  transactionReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HostPayoutSchema = new Schema<IHostPayout>(
  {
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true, min: 0 },
    commission: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
      index: true,
    },
    paidAt: { type: Date },
    transactionReference: { type: String },
  },
  { timestamps: true }
);

HostPayoutSchema.index({ booking: 1 }, { unique: true });

const HostPayout: Model<IHostPayout> =
  mongoose.models.HostPayout || mongoose.model<IHostPayout>('HostPayout', HostPayoutSchema);

export default HostPayout;