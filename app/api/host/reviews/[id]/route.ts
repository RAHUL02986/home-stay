import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Property from '@/models/Property';
import Review from '@/models/Review';

const responseSchema = z.object({
  response: z.string().trim().min(1).max(1500),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Please sign in to reply to reviews' }, { status: 401 });
  }
  if (session.user.role !== 'host') {
    return NextResponse.json({ success: false, error: 'Only hosts can reply to reviews' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, error: 'Invalid review ID' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid host response' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const review = await Review.findOne({ _id: id, status: 'approved' }).select('property').lean();
    if (!review) {
      return NextResponse.json({ success: false, error: 'Approved review not found' }, { status: 404 });
    }

    const property = await Property.findOne({ _id: review.property, host: session.user.id })
      .select('_id')
      .lean();
    if (!property) {
      return NextResponse.json({ success: false, error: 'You do not manage this property' }, { status: 403 });
    }

    const result = await Review.updateOne(
      { _id: id, property: property._id, status: 'approved' },
      { $set: { hostResponse: parsed.data.response, hostRespondedAt: new Date() } },
      { runValidators: true }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Review is no longer available for a reply' }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: { response: parsed.data.response } });
  } catch (error) {
    console.error('Failed to save host review response', error);
    return NextResponse.json({ success: false, error: 'Failed to save host response' }, { status: 500 });
  }
}
