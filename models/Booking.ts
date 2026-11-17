// models/Booking.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
export type BookingSource = 'instant' | 'request';

export interface IBooking extends Document {
  guest: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId; // reference to Room
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  numberOfRooms: number;
  status: BookingStatus;
  paymentInProgress: boolean;
  source: BookingSource;
  priceBreakdown: {
    basePrice: number;
    nights: number;
    rooms: number;
    extraGuestCharges: number;
    subtotal: number;
    tax: number;
    serviceFee: number;
    discount: number;
    total: number;
  };
  couponCode?: string;
  couponDiscount?: number;
  travelerDetails: {
    fullName: string;
    email: string;
    phone: string;
    idProof?: string;
    idProofType?: string;
  };
  specialRequests?: string;
  whatsappConsent: boolean;
  whatsappConsentAt?: Date;
  cancellationRequestedAt?: Date;
  cancellationReason?: string;
  refundAmount?: number;
  refundStatus?: 'none' | 'pending' | 'processed' | 'failed';
  hostConfirmedAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    guest: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    numberOfGuests: { type: Number, required: true, min: 1 },
    numberOfRooms: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentInProgress: { type: Boolean, default: false },
    source: { type: String, enum: ['instant', 'request'], default: 'instant' },
    priceBreakdown: {
      basePrice: { type: Number, required: true },
      nights: { type: Number, required: true },
      rooms: { type: Number, required: true },
      extraGuestCharges: { type: Number, default: 0 },
      subtotal: { type: Number, required: true },
      tax: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    travelerDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      idProof: { type: String },
      idProofType: { type: String },
    },
    specialRequests: { type: String },
    whatsappConsent: { type: Boolean, default: false },
    whatsappConsentAt: { type: Date },
    cancellationRequestedAt: { type: Date },
    cancellationReason: { type: String },
    refundAmount: { type: Number },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processed', 'failed'],
      default: 'none',
    },
    hostConfirmedAt: { type: Date },
    checkedInAt: { type: Date },
    checkedOutAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent double bookings: same room, overlapping dates, active status
BookingSchema.index(
  { room: 1, checkInDate: 1, checkOutDate: 1, status: 1 },
  { unique: false }
);

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;