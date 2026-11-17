import mongoose, { Model, Schema, Types } from 'mongoose';

interface IRoomAllocation {
  booking: Types.ObjectId;
  quantity: number;
}

export interface IRoomInventory extends mongoose.Document {
  room: Types.ObjectId;
  date: string;
  totalRooms: number;
  allocations: IRoomAllocation[];
}

const RoomInventorySchema = new Schema<IRoomInventory>(
  {
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: String, required: true },
    totalRooms: { type: Number, required: true, min: 1 },
    allocations: {
      type: [{
        booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        quantity: { type: Number, required: true, min: 1 },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

RoomInventorySchema.index({ room: 1, date: 1 }, { unique: true });

const RoomInventory: Model<IRoomInventory> =
  mongoose.models.RoomInventory ||
  mongoose.model<IRoomInventory>('RoomInventory', RoomInventorySchema);

export default RoomInventory;
