import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Review from '@/models/Review';

const reviewSchema = z.object({
  bookingId: z.string().regex(/^[a-f\d]{24}$/i),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1500),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Please sign in to leave a review' }, { status: 401 });
  }
  if (session.user.role !== 'guest') {
    return NextResponse.json({ success: false, error: 'Only guests can submit stay reviews' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid review' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const booking = await Booking.findOne({
      _id: parsed.data.bookingId,
      guest: session.user.id,
      status: { $in: ['confirmed', 'completed'] },
      checkOutDate: { $lte: new Date() },
    }).select('property').lean();
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reviews are available only after a completed stay on your account' },
        { status: 403 }
      );
    }

    const { rating, comment } = parsed.data;
    const reviewFields = {
      property: booking.property,
      guest: new mongoose.Types.ObjectId(session.user.id),
      booking: booking._id,
      rating,
      comment,
      status: 'pending' as const,
    };

    const rejectedReview = await Review.findOneAndUpdate(
      { booking: booking._id, guest: session.user.id, status: 'rejected' },
      { $set: reviewFields },
      { returnDocument: 'after', runValidators: true }
    );
    if (rejectedReview) {
      return NextResponse.json({ success: true, data: { id: rejectedReview._id.toString(), status: 'pending' } });
    }

    try {
      const review = await Review.create(reviewFields);
      return NextResponse.json(
        { success: true, data: { id: review._id.toString(), status: review.status } },
        { status: 201 }
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return NextResponse.json(
          { success: false, error: 'A review has already been submitted for this booking' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to submit guest review', error);
    return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 });
  }
}
