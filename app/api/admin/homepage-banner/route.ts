import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import HomepageBanner from '@/models/HomepageBanner';
import Property from '@/models/Property';

const bannerSchema = z.object({
  propertyId: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid property'),
  eyebrow: z.string().trim().min(1).max(40),
  badge: z.string().trim().min(1).max(40),
  titleOverride: z.string().trim().max(80),
  areaOverride: z.string().trim().max(80),
  priceOverride: z.number().finite().min(0).nullable(),
  ratingOverride: z.number().finite().min(1).max(5).nullable(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Please sign in' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid banner settings' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const { propertyId, ...settings } = parsed.data;
    const property = await Property.findOne({ _id: propertyId, status: 'approved' })
      .select('_id')
      .lean();
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Choose a property that is currently approved' },
        { status: 400 }
      );
    }

    const banner = await HomepageBanner.findOneAndUpdate(
      { key: 'homepage' },
      {
        $set: {
          ...settings,
          property: new mongoose.Types.ObjectId(propertyId),
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: { id: banner._id.toString() } });
  } catch (error) {
    console.error('Failed to save homepage banner settings', error);
    return NextResponse.json({ success: false, error: 'Failed to save homepage banner settings' }, { status: 500 });
  }
}
