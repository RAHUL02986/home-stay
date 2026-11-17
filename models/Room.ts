// models/Room.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type RoomAvailability = 'available' | 'unavailable';

export interface IBlockedDate {
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface ISeasonalPrice {
  name: string;
  startDate: Date;
  endDate: Date;
  priceMultiplier: number;
}

export interface IRoom extends Document {
  property: mongoose.Types.ObjectId;
  type: string; // e.g., Deluxe, Suite, Cottage, Dormitory
  pricePerNight: number;
  maxGuests: number;
  availability: RoomAvailability;
  features: string[]; // room-specific features
  images: string[]; // room images
  totalRooms: number; // inventory count of this room type
  extraGuestCharge: number; // per extra guest beyond maxGuests
  blockedDates: IBlockedDate[];
  seasonalPricing: ISeasonalPrice[];
  minStay: number; // minimum nights
  maxStay?: number; // maximum nights
  advanceBookingDays: number; // how many days in advance can book
  createdAt: Date;
  updatedAt: Date;
}

const BlockedDateSchema = new Schema<IBlockedDate>({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String },
});

const SeasonalPriceSchema = new Schema<ISeasonalPrice>({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  priceMultiplier: { type: Number, default: 1, min: 0 },
});

const RoomSchema = new Schema<IRoom>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    type: { type: String, required: true, trim: true },
    pricePerNight: { type: Number, required: true, min: 0 },
    maxGuests: { type: Number, required: true, min: 1 },
    availability: {
      type: String,
      enum: ['available', 'unavailable'],
      default: 'available',
    },
    features: { type: [String], default: [] },
    images: { type: [String], default: [] },
    totalRooms: { type: Number, required: true, min: 1, default: 1 },
    extraGuestCharge: { type: Number, default: 0, min: 0 },
    blockedDates: { type: [BlockedDateSchema], default: [] },
    seasonalPricing: { type: [SeasonalPriceSchema], default: [] },
    minStay: { type: Number, default: 1 },
    maxStay: { type: Number },
    advanceBookingDays: { type: Number, default: 0 },
  },
  { timestamps: true }
);

RoomSchema.index({ availability: 1 });

const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;
