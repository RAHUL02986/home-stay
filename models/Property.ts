// models/Property.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type PropertyType = 'homestay' | 'hotel' | 'guesthouse' | 'resort' | 'apartment' | 'villa';
export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface ICoordinates {
  lat: number;
  lng: number;
}

export interface IProperty extends Document {
  host: mongoose.Types.ObjectId;
  name: string;
  description: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  area: string; // e.g., McLeodganj, Dharamkot, Naddi, Bhagsu
  address: string;
  coordinates?: ICoordinates;
  amenities: string[]; // amenity names
  images: string[]; // Cloudinary URLs
  checkInTime: string; // "14:00"
  checkOutTime: string; // "10:00"
  houseRules: string[];
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  commissionRate: number; // platform commission percentage (0-100)
  verificationBadge: boolean;
  totalRooms: number;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    propertyType: {
      type: String,
      enum: ['homestay', 'hotel', 'guesthouse', 'resort', 'apartment', 'villa'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    area: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '10:00' },
    houseRules: { type: [String], default: [] },
    cancellationPolicy: {
      type: String,
      enum: ['flexible', 'moderate', 'strict'],
      default: 'moderate',
    },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    verificationBadge: { type: Boolean, default: false },
    totalRooms: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PropertySchema.index({ name: 'text', description: 'text', area: 'text' });
PropertySchema.index({ status: 1, area: 1 });

const Property: Model<IProperty> =
  mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);

export default Property;
