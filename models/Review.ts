// models/Review.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

export interface IReview extends Document {
  property: mongoose.Types.ObjectId;
  guest: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  rating: number; // 1-5 overall
  cleanlinessRating: number;
  locationRating: number;
  serviceRating: number;
  facilitiesRating: number;
  comment: string;
  images: string[]; // review photos
  status: ReviewStatus;
  hostResponse?: string;
  hostRespondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    guest: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    cleanlinessRating: { type: Number, min: 1, max: 5 },
    locationRating: { type: Number, min: 1, max: 5 },
    serviceRating: { type: Number, min: 1, max: 5 },
    facilitiesRating: { type: Number, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'hidden'],
      default: 'pending',
      index: true,
    },
    hostResponse: { type: String },
    hostRespondedAt: { type: Date },
  },
  { timestamps: true }
);

// One review per booking
ReviewSchema.index({ booking: 1 }, { unique: true });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;