import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import Room from '@/models/Room';
import RoomInventory from '@/models/RoomInventory';
import User from '@/models/User';
import { isDormitoryRoom } from '@/lib/roomPricing';
import {
  isMetaWhatsAppConfigured,
  isWhatsAppPhoneNumber,
  sendWhatsAppTemplate,
  WhatsAppDeliveryStatus,
} from '@/lib/whatsapp';

const createBookingSchema = z.object({
  propertyId: z.string().regex(/^[a-f\d]{24}$/i),
  roomId: z.string().regex(/^[a-f\d]{24}$/i),
  checkInDate: z.string().date(),
  checkOutDate: z.string().date(),
  numberOfGuests: z.number().int().min(1).max(30),
  numberOfRooms: z.number().int().min(1).max(10),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  whatsappOptIn: z.boolean().default(false),
  specialRequests: z.string().trim().max(1000).optional(),
}).superRefine((booking, context) => {
  if (booking.whatsappOptIn && !isWhatsAppPhoneNumber(booking.phone)) {
    context.addIssue({
      code: 'custom',
      path: ['phone'],
      message: 'For WhatsApp updates, use international phone format such as +14155552671',
    });
  }
});

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function eachStayDate(start: Date, nights: number) {
  return Array.from({ length: nights }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function formatStayDate(date: Date) {
  return date.toLocaleDateString('en-IN', { timeZone: 'UTC' });
}

async function deliverBookingWhatsApp({
  role,
  to,
  templateName,
  parameters,
  optedIn,
}: {
  role: 'guest' | 'host';
  to: string | undefined;
  templateName: string;
  parameters: string[];
  optedIn: boolean;
}): Promise<WhatsAppDeliveryStatus> {
  if (!optedIn) return 'not_opted_in';
  if (!to) return 'missing_phone';
  if (!isWhatsAppPhoneNumber(to)) return 'invalid_phone';
  if (!isMetaWhatsAppConfigured()) return 'not_configured';

  try {
    await sendWhatsAppTemplate({ to, templateName, parameters });
    return 'sent';
  } catch (error) {
    console.error(`Failed to send ${role} WhatsApp booking notification`, error);
    return 'failed';
  }
}

async function availableRooms(roomId: mongoose.Types.ObjectId, day: string, capacity: number) {
  const inventory = await RoomInventory.findOne({ room: roomId, date: day }).lean();
  const allocated = inventory?.allocations.reduce((sum, allocation) => sum + allocation.quantity, 0) || 0;
  return Math.max(0, capacity - allocated);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Please sign in to view bookings' }, { status: 401 });
  }
  if (session.user.role === 'admin') {
    return NextResponse.json({ success: false, error: 'Use the admin booking dashboard' }, { status: 403 });
  }

  try {
    await dbConnect();
    const query = session.user.role === 'guest'
      ? { guest: session.user.id }
      : { property: { $in: (await Property.find({ host: session.user.id }).distinct('_id')) } };
    const bookings = await Booking.find(query)
      .populate('property', 'name area')
      .populate('room', 'type')
      .populate('guest', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Failed to fetch bookings', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Please sign in to request a booking' }, { status: 401 });
  }
  if (session.user.role !== 'guest') {
    return NextResponse.json({ success: false, error: 'Only guest accounts can request bookings' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid booking details' },
      { status: 400 }
    );
  }

  const { propertyId, roomId, checkInDate, checkOutDate, numberOfGuests, numberOfRooms } = parsed.data;
  const checkIn = new Date(`${checkInDate}T00:00:00.000Z`);
  const checkOut = new Date(`${checkOutDate}T00:00:00.000Z`);
  const nights = daysBetween(checkIn, checkOut);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (checkIn < today || nights < 1 || nights > 30) {
    return NextResponse.json({ success: false, error: 'Choose valid future dates for a stay of 1 to 30 nights' }, { status: 400 });
  }

  try {
    await dbConnect();
    const property = await Property.findOne({ _id: propertyId, status: 'approved' })
      .select('_id name host')
      .lean();
    if (!property) {
      return NextResponse.json({ success: false, error: 'This property is not available for booking' }, { status: 404 });
    }

    const room = await Room.findOne({ _id: roomId, property: propertyId, availability: 'available' }).lean();
    if (!room) {
      return NextResponse.json({ success: false, error: 'This room is not available' }, { status: 404 });
    }
    if (numberOfGuests > room.maxGuests * numberOfRooms) {
      return NextResponse.json({ success: false, error: 'Selected rooms do not have enough guest capacity' }, { status: 400 });
    }
    if (nights < room.minStay || (room.maxStay && nights > room.maxStay)) {
      return NextResponse.json({ success: false, error: 'Stay length does not meet this room’s minimum or maximum stay' }, { status: 400 });
    }
    if (room.advanceBookingDays > 0) {
      const earliestCheckIn = new Date(today);
      earliestCheckIn.setUTCDate(earliestCheckIn.getUTCDate() + room.advanceBookingDays);
      if (checkIn < earliestCheckIn) {
        return NextResponse.json({ success: false, error: `This room must be booked at least ${room.advanceBookingDays} days in advance` }, { status: 400 });
      }
    }

    const stayDates = eachStayDate(checkIn, nights);
    const blockedDates = room.blockedDates || [];
    if (stayDates.some((day) => blockedDates.some((blocked) => {
      const date = new Date(`${day}T00:00:00.000Z`);
      return date >= blocked.startDate && date < blocked.endDate;
    }))) {
      return NextResponse.json({ success: false, error: 'This room is blocked for one or more selected dates' }, { status: 409 });
    }

    for (const day of stayDates) {
      if (await availableRooms(room._id, day, room.totalRooms) < numberOfRooms) {
        return NextResponse.json({ success: false, error: 'Not enough rooms are available for the selected dates' }, { status: 409 });
      }
    }

    const host = await User.findById(property.host).select('name phone whatsappBookingOptIn').lean();
    const extraGuests = Math.max(0, numberOfGuests - room.maxGuests * numberOfRooms);
    const basePrice = room.pricePerNight * nights * (
      isDormitoryRoom(room.type) ? numberOfGuests : numberOfRooms
    );
    const extraGuestCharges = room.extraGuestCharge * extraGuests * nights;
    const subtotal = basePrice + extraGuestCharges;
    const booking = await Booking.create({
      guest: session.user.id,
      property: property._id,
      room: room._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests,
      numberOfRooms,
      status: 'pending',
      source: 'request',
      priceBreakdown: {
        basePrice: room.pricePerNight,
        nights,
        rooms: numberOfRooms,
        extraGuestCharges,
        subtotal,
        tax: 0,
        serviceFee: 0,
        discount: 0,
        total: subtotal,
      },
      travelerDetails: {
        fullName: parsed.data.fullName,
        email: session.user.email || '',
        phone: parsed.data.phone,
      },
      whatsappConsent: parsed.data.whatsappOptIn,
      whatsappConsentAt: parsed.data.whatsappOptIn ? new Date() : undefined,
      specialRequests: parsed.data.specialRequests,
    });

    const bookingId = booking._id.toString();
    const checkInLabel = formatStayDate(checkIn);
    const checkOutLabel = formatStayDate(checkOut);
    const guestTemplate = process.env.META_WHATSAPP_GUEST_BOOKING_TEMPLATE?.trim() || '';
    const hostTemplate = process.env.META_WHATSAPP_HOST_BOOKING_TEMPLATE?.trim() || '';
    const [guestWhatsApp, hostWhatsApp] = await Promise.all([
      deliverBookingWhatsApp({
        role: 'guest',
        to: parsed.data.phone,
        templateName: guestTemplate,
        optedIn: parsed.data.whatsappOptIn,
        parameters: [
          parsed.data.fullName,
          property.name,
          room.type,
          checkInLabel,
          checkOutLabel,
          String(numberOfRooms),
          String(numberOfGuests),
          bookingId,
        ],
      }),
      deliverBookingWhatsApp({
        role: 'host',
        to: host?.phone,
        templateName: hostTemplate,
        optedIn: host?.whatsappBookingOptIn === true,
        parameters: [
          host?.name || 'Host',
          parsed.data.fullName,
          property.name,
          room.type,
          String(numberOfRooms),
          String(numberOfGuests),
          checkInLabel,
          checkOutLabel,
          bookingId,
        ],
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: bookingId,
          status: booking.status,
          whatsapp: { guest: guestWhatsApp, host: hostWhatsApp },
        },
        message: 'Booking request sent to the host',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create booking request', error);
    return NextResponse.json({ success: false, error: 'Failed to create booking request' }, { status: 500 });
  }
}
