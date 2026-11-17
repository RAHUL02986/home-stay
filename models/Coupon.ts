// models/Coupon.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type CouponType = 'percentage' | 'fixed';

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number; // percentage (0-100) or fixed amount
  minBookingValue?: number;
  maxDiscount?: number;
  usageLimit?: number; // total uses allowed
  usedCount: number;
  perUserLimit?: number; // uses per user
  validFrom: Date;
  validUntil: Date;
  applicableProperty?: mongoose.Types.ObjectId; // if property-specific
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minBookingValue: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, min: 1 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    applicableProperty: { type: Schema.Types.ObjectId, ref: 'Property' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;