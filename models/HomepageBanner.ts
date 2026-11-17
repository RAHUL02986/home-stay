import mongoose, { Model, Schema, Document } from 'mongoose';

export interface IHomepageBanner extends Document {
  key: string;
  property: mongoose.Types.ObjectId;
  eyebrow: string;
  badge: string;
  titleOverride: string;
  areaOverride: string;
  priceOverride: number | null;
  ratingOverride: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const HomepageBannerSchema = new Schema<IHomepageBanner>(
  {
    key: { type: String, required: true, unique: true, default: 'homepage' },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    eyebrow: { type: String, required: true, trim: true, maxlength: 40, default: 'This week' },
    badge: { type: String, required: true, trim: true, maxlength: 40, default: 'Best value' },
    titleOverride: { type: String, trim: true, maxlength: 80, default: '' },
    areaOverride: { type: String, trim: true, maxlength: 80, default: '' },
    priceOverride: { type: Number, min: 0, default: null },
    ratingOverride: { type: Number, min: 1, max: 5, default: null },
  },
  { timestamps: true }
);

const HomepageBanner: Model<IHomepageBanner> =
  mongoose.models.HomepageBanner ||
  mongoose.model<IHomepageBanner>('HomepageBanner', HomepageBannerSchema);

export default HomepageBanner;
