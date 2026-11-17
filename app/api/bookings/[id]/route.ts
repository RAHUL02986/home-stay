import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import Property from '@/models/Property';
import Room from '@/models/Room';
import RoomInventory from '@/models/RoomInventory';

const actionSchema = z.object({
  action: z.enum(['confirm', 'reject', 'cancel']),
});

function stayDates(checkIn: Date, checkOut: Date) {
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
  return Array.from({ length: nights }, (_, index) => {
    const date = new Date(checkIn);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

async function releaseInventory(bookingId: mongoose.Types.ObjectId) {
  await RoomInventory.updateMany(
    { 'allocations.booking': bookingId },
    { $pull: { allocations: { booking: bookingId } } }
  );
}

async function reserveInventory(
  bookingId: mongoose.Types.ObjectId,
  roomId: mongoose.Types.ObjectId,
  totalRooms: number,
  quantity: number,
  dates: string[]
) {
  for (const date of dates) {
    try {
      await RoomInventory.updateOne(
        { room: roomId, date },
        { $setOnInsert: { room: roomId, date, totalRooms, allocations: [] } },
        { upsert: true }
      );
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) {
        throw error;
      }
    }

    await RoomInventory.updateOne(
      { room: roomId, date },
      { $set: { totalRooms } }
    );

    const alreadyAllocated = await RoomInventory.exists({
      room: roomId,
      date,
      allocations: { $elemMatch: { booking: bookingId, quantity } },
    });
    if (alreadyAllocated) continue;

    const result = await RoomInventory.updateOne(
      {
        room: roomId,
        date,
        'allocations.booking': { $ne: bookingId },
        $expr: {
          $lte: [
            {
              $add: [
                { $sum: '$allocations.quantity' },
                quantity,
              ],
            },
            '$totalRooms',
          ],
        },
      },
      { $push: { allocations: { booking: bookingId, quantity } } }
    );
    if (result.modifiedCount !== 1) {
      await releaseInventory(bookingId);
      return false;
    }
  }

  return true;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Please sign in' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid booking action' }, { status: 400 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (parsed.data.action === 'cancel') {
      if (String(booking.guest) !== session.user.id || session.user.role !== 'guest') {
        return NextResponse.json({ success: false, error: 'You cannot cancel this booking' }, { status: 403 });
      }
      if (!['pending', 'confirmed'].includes(booking.status) || booking.checkInDate <= new Date()) {
        return NextResponse.json({ success: false, error: 'This booking is no longer eligible for cancellation' }, { status: 409 });
      }
      const payment = await Payment.findOne({ booking: booking._id }).select('status').lean();
      if (payment && ['pending', 'success', 'partially_refunded'].includes(payment.status)) {
        return NextResponse.json(
          { success: false, error: 'This booking has a payment that must be resolved before cancellation. Please contact support.' },
          { status: 409 }
        );
      }

      const cancelled = await Booking.findOneAndUpdate(
        { _id: booking._id, status: booking.status, paymentInProgress: { $ne: true } },
        { $set: { status: 'cancelled', cancellationRequestedAt: new Date() } },
        { new: true }
      );
      if (!cancelled) {
        return NextResponse.json({ success: false, error: 'Booking status changed; refresh and try again' }, { status: 409 });
      }
      await releaseInventory(booking._id);
      return NextResponse.json({ success: true, data: { id, status: cancelled.status } });
    }

    if (session.user.role !== 'host') {
      return NextResponse.json({ success: false, error: 'Only the property host can review this booking' }, { status: 403 });
    }
    const property = await Property.findOne({ _id: booking.property, host: session.user.id }).select('_id');
    if (!property) {
      return NextResponse.json({ success: false, error: 'You cannot manage this booking' }, { status: 403 });
    }
    if (booking.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Only pending booking requests can be reviewed' }, { status: 409 });
    }

    if (parsed.data.action === 'reject') {
      const rejected = await Booking.findOneAndUpdate(
        { _id: booking._id, status: 'pending' },
        { $set: { status: 'cancelled', cancellationReason: 'Rejected by host' } },
        { new: true }
      );
      if (!rejected) {
        return NextResponse.json({ success: false, error: 'Booking status changed; refresh and try again' }, { status: 409 });
      }
      await releaseInventory(booking._id);
      return NextResponse.json({ success: true, data: { id, status: rejected.status } });
    }

    const room = await Room.findById(booking.room).select('totalRooms availability blockedDates').lean();
    if (!room || room.availability !== 'available') {
      return NextResponse.json({ success: false, error: 'The requested room is no longer available' }, { status: 409 });
    }
    if (room.blockedDates.some((blocked) =>
      stayDates(booking.checkInDate, booking.checkOutDate).some((date) => {
        const checkInDate = new Date(`${date}T00:00:00.000Z`);
        return checkInDate >= blocked.startDate && checkInDate < blocked.endDate;
      })
    )) {
      return NextResponse.json({ success: false, error: 'The requested stay overlaps dates blocked by the host' }, { status: 409 });
    }

    const allocated = await reserveInventory(
      booking._id,
      booking.room,
      room.totalRooms,
      booking.numberOfRooms,
      stayDates(booking.checkInDate, booking.checkOutDate)
    );
    if (!allocated) {
      return NextResponse.json({ success: false, error: 'Not enough rooms are available for these dates' }, { status: 409 });
    }

    const confirmed = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'pending' },
      { $set: { status: 'confirmed', hostConfirmedAt: new Date() } },
      { new: true }
    );
    if (!confirmed) {
      const current = await Booking.findById(booking._id).select('status').lean();
      if (current?.status === 'confirmed') {
        return NextResponse.json({ success: true, data: { id, status: current.status } });
      }
      await releaseInventory(booking._id);
      return NextResponse.json({ success: false, error: 'Booking status changed; refresh and try again' }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: { id, status: confirmed.status } });
  } catch (error) {
    console.error('Failed to update booking', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 });
  }
}
