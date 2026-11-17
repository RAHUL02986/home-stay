// models/Payment.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'authorizenet' | 'razorpay' | 'cash' | 'wallet';

export interface IPayment extends Document {
  booking: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  authorizeNetTransactionId?: string;
  authorizeNetReferenceId?: string;
  refundId?: string;
  refundAmount?: number;
  refundStatus?: 'none' | 'pending' | 'processed' | 'failed';
  gatewayResponse: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true,
    },
    method: { type: String, enum: ['authorizenet', 'razorpay', 'cash', 'wallet'], default: 'razorpay' },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    authorizeNetTransactionId: { type: String, index: true },
    authorizeNetReferenceId: { type: String, unique: true, sparse: true },
    refundId: { type: String },
    refundAmount: { type: Number },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processed', 'failed'],
      default: 'none',
    },
    gatewayResponse: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

PaymentSchema.index({ booking: 1 }, { unique: true });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;