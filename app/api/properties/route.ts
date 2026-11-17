// app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ensureSampleProperties } from '@/lib/sampleProperties';
import Property from '@/models/Property';
import Room from '@/models/Room';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IProperty } from '@/models/Property';
import { IRoom } from '@/models/Room';
import { isDormitoryRoom } from '@/lib/roomPricing';

const roomInputSchema = z.object({
  type: z.string().trim().min(1, 'Room type is required'),
  pricePerNight: z.number().finite().min(0, 'Price must be zero or more'),
  maxGuests: z.number().int().min(1, 'Maximum guests must be at least one'),
  availability: z.enum(['available', 'unavailable']).default('available'),
  features: z.array(z.string().trim().min(1)).default([]),
  images: z.array(z.string().url()).default([]),
  totalRooms: z.number().int().min(1).default(1),
  extraGuestCharge: z.number().finite().min(0).default(0),
  minStay: z.number().int().min(1).default(1),
  maxStay: z.number().int().min(1).optional(),
  advanceBookingDays: z.number().int().min(0).default(0),
});

const createPropertySchema = z.object({
  property: z.object({
    name: z.string().trim().min(1, 'Property name is required'),
    description: z.string().trim().min(1, 'Description is required'),
    propertyType: z.enum(['homestay', 'hotel', 'guesthouse', 'resort', 'apartment', 'villa']).default('homestay'),
    area: z.string().trim().min(1, 'Area is required'),
    address: z.string().trim().min(1, 'Address is required'),
    coordinates: z.object({
      lat: z.number().finite().min(-90).max(90),
      lng: z.number().finite().min(-180).max(180),
    }).optional(),
    amenities: z.array(z.string().trim().min(1)).default([]),
    images: z.array(z.string().url()).default([]),
    checkInTime: z.string().default('14:00'),
    checkOutTime: z.string().default('10:00'),
    houseRules: z.array(z.string().trim().min(1)).default([]),
    cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']).default('moderate'),
  }),
  rooms: z.array(roomInputSchema).min(1, 'Add at least one room').max(20, 'A property can have at most 20 room types'),
});

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    if (process.env.NODE_ENV !== 'production') {
      await ensureSampleProperties();
    }
    const { searchParams } = new URL(req.url);

    const area = searchParams.get('area');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const amenity = searchParams.get('amenity');
    const availability = searchParams.get('availability');
    const propertyType = z
      .enum(['homestay', 'hotel', 'guesthouse', 'resort', 'apartment', 'villa'])
      .safeParse(searchParams.get('propertyType'));
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    const query: {
      status: IProperty['status'];
      area?: RegExp;
      propertyType?: IProperty['propertyType'];
      amenities?: { $in: RegExp[] };
    } = { status: 'approved' };
    if (area) query.area = new RegExp(area, 'i');
    if (propertyType.success) query.propertyType = propertyType.data;
    if (amenity) query.amenities = { $in: [new RegExp(amenity, 'i')] };

    let properties = await Property.find(query)
      .populate('host', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Property.countDocuments(query);

    // Filter by room price / availability when requested
    if (minPrice || maxPrice || availability) {
      const roomQuery: {
        pricePerNight?: { $gte?: number; $lte?: number };
        availability?: IRoom['availability'];
      } = {};
      if (minPrice || maxPrice) {
        const priceRange: { $gte?: number; $lte?: number } = {};
        if (minPrice) priceRange.$gte = Number(minPrice);
        if (maxPrice) priceRange.$lte = Number(maxPrice);
        roomQuery.pricePerNight = priceRange;
      }
      if (availability === 'available' || availability === 'unavailable') {
        roomQuery.availability = availability;
      }

      const matchingRooms = await Room.find(roomQuery).select('property').lean();
      const propertyIds = new Set(matchingRooms.map((r) => String(r.property)));
      properties = properties.filter((p) => propertyIds.has(String(p._id)));
    }

    // Attach the cheapest room price to each property for listing cards
    const propertyIds = properties.map((p) => p._id);
    const rooms = propertyIds.length
      ? await Room.find({ property: { $in: propertyIds } }).select('property pricePerNight type').lean()
      : [];
    const minPriceByProperty: Record<string, { price: number; isPerPerson: boolean }> = {};
    for (const room of rooms) {
      const pid = String(room.property);
      const price = Number(room.pricePerNight);
      if (
        !(pid in minPriceByProperty) ||
        price < minPriceByProperty[pid].price
      ) {
        minPriceByProperty[pid] = {
          price,
          isPerPerson: isDormitoryRoom(room.type),
        };
      }
    }
    const propertiesWithPrice = properties.map((p) => {
      const pid = String(p._id);
      return {
        ...p,
        minPrice: minPriceByProperty[pid]?.price,
        minPriceIsPerPerson: minPriceByProperty[pid]?.isPerPerson,
      };
    });

    return NextResponse.json({
      success: true,
      data: propertiesWithPrice,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Please sign in to list a property' }, { status: 401 });
    }
    if (session.user.role !== 'host') {
      return NextResponse.json({ success: false, error: 'Only host accounts can list properties' }, { status: 403 });
    }

    await dbConnect();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const parsed = createPropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid property data' },
        { status: 400 }
      );
    }

    const { property, rooms } = parsed.data;
    const newProperty = await Property.create({
      host: session.user.id,
      name: property.name,
      description: property.description,
      propertyType: property.propertyType,
      status: 'pending',
      area: property.area,
      address: property.address,
      coordinates: property.coordinates,
      amenities: property.amenities || [],
      images: property.images || [],
      checkInTime: property.checkInTime || '14:00',
      checkOutTime: property.checkOutTime || '10:00',
      houseRules: property.houseRules || [],
      cancellationPolicy: property.cancellationPolicy || 'moderate',
      commissionRate: 10,
      verificationBadge: false,
      totalRooms: rooms.reduce((total, room) => total + room.totalRooms, 0),
    });

    try {
      const roomDocs = rooms.map((room) => ({
        property: newProperty._id,
        ...room,
      }));
      await Room.insertMany(roomDocs);
    } catch (error) {
      await Room.deleteMany({ property: newProperty._id });
      await Property.deleteOne({ _id: newProperty._id });
      throw error;
    }

    const populated = await Property.findById(newProperty._id)
      .populate('host', 'name email')
      .lean();
    const propertyRooms = await Room.find({ property: newProperty._id }).lean();

    return NextResponse.json(
      {
        success: true,
        data: { property: populated, rooms: propertyRooms },
        message: 'Property submitted for admin review',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create property', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
