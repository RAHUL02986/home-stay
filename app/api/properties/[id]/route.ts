// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Property from '@/models/Property';
import Room from '@/models/Room';
import RoomInventory from '@/models/RoomInventory';

const updatePropertySchema = z.object({
  property: z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(5000),
    propertyType: z.enum(['homestay', 'hotel', 'guesthouse', 'resort', 'apartment', 'villa']),
    area: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(300),
    coordinates: z.object({
      lat: z.number().finite().min(-90).max(90),
      lng: z.number().finite().min(-180).max(180),
    }).optional(),
  }),
  rooms: z.array(z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    type: z.string().trim().min(1).max(100),
    pricePerNight: z.number().finite().min(0).max(1_000_000),
    maxGuests: z.number().int().min(1).max(30),
    totalRooms: z.number().int().min(1).max(10_000),
    availability: z.enum(['available', 'unavailable']),
    blockedDates: z.array(z.object({
      startDate: z.string().date(),
      endDate: z.string().date(),
      reason: z.string().trim().max(200).default('Blocked by host'),
    })).max(365),
  })).min(1).max(20),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Please sign in to manage this property' }, { status: 401 });
  }
  if (session.user.role !== 'host') {
    return NextResponse.json({ success: false, error: 'Only hosts can manage their properties' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, error: 'Invalid property ID' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }
  const parsed = updatePropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid property changes' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const property = await Property.findOne({ _id: id, host: session.user.id });
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    const currentRooms = await Room.find({ property: property._id }).select('_id totalRooms').lean();
    const currentRoomIds = new Set(currentRooms.map((room) => room._id.toString()));
    const submittedIds = parsed.data.rooms.flatMap((room) => room.id ? [room.id] : []);
    if (new Set(submittedIds).size !== submittedIds.length || submittedIds.some((roomId) => !currentRoomIds.has(roomId))) {
      return NextResponse.json({ success: false, error: 'One or more rooms do not belong to this property' }, { status: 400 });
    }
    const newRoomCount = parsed.data.rooms.filter((room) => !room.id).length;
    if (currentRooms.length + newRoomCount > 20) {
      return NextResponse.json({ success: false, error: 'A property can have at most 20 room types' }, { status: 400 });
    }

    for (const room of parsed.data.rooms) {
      if (!room.id) continue;
      const inventory = await RoomInventory.find({ room: room.id }).select('date allocations').lean();
      const overbooked = inventory.some((day) =>
        day.allocations.reduce((total, allocation) => total + allocation.quantity, 0) > room.totalRooms
      );
      if (overbooked) {
        return NextResponse.json(
          { success: false, error: `Cannot reduce ${room.type} below rooms already reserved on one or more dates` },
          { status: 409 }
        );
      }
      const hasConfirmedStayOnBlockedDate = inventory.some((day) =>
        room.blockedDates.some((blocked) => day.date >= blocked.startDate && day.date < blocked.endDate) &&
        day.allocations.some((allocation) => allocation.quantity > 0)
      );
      if (hasConfirmedStayOnBlockedDate) {
        return NextResponse.json(
          { success: false, error: `Cannot block dates that already have confirmed reservations for ${room.type}` },
          { status: 409 }
        );
      }
    }

    const { property: propertyChanges, rooms } = parsed.data;
    Object.assign(property, propertyChanges);
    await property.save();

    const savedRooms: Array<{ id: string }> = [];
    for (const room of rooms) {
      const { id: roomId, ...roomChanges } = room;
      if (roomId) {
        await Room.updateOne(
          { _id: roomId, property: property._id },
          { $set: roomChanges },
          { runValidators: true }
        );
        savedRooms.push({ id: roomId });
        await RoomInventory.updateMany(
          { room: roomId },
          { $set: { totalRooms: room.totalRooms } }
        );
      } else {
        const createdRoom = await Room.create({ ...roomChanges, property: property._id });
        savedRooms.push({ id: createdRoom._id.toString() });
      }
    }

    const totalRooms = await Room.aggregate([
      { $match: { property: property._id } },
      { $group: { _id: null, total: { $sum: '$totalRooms' } } },
    ]);
    property.totalRooms = totalRooms[0]?.total || 0;
    await property.save();

    return NextResponse.json({
      success: true,
      data: { rooms: savedRooms },
      message: 'Property and room changes saved',
    });
  } catch (error) {
    console.error('Failed to update host property', error);
    return NextResponse.json({ success: false, error: 'Failed to save property changes' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const property = await Property.findOne({ _id: id, status: 'approved' })
      .populate('host', 'name email profileImage')
      .lean();

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const rooms = await Room.find({ property: id }).sort({ pricePerNight: 1 }).lean();

    return NextResponse.json(
      { success: true, data: { property, rooms } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch property' },
      { status: 500 }
    );
  }
}
