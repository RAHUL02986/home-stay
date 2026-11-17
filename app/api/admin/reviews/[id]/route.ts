import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';

const moderationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Only administrators can moderate reviews' }, { status: 403 });
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
  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Choose approve or reject' }, { status: 400 });
  }

  try {
    await dbConnect();
    const review = await Review.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { $set: { status: parsed.data.status } },
      { returnDocument: 'after' }
    );
    if (!review) {
      return NextResponse.json({ success: false, error: 'Pending review not found; it may already be moderated' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id: review._id.toString(), status: review.status } });
  } catch (error) {
    console.error('Failed to moderate guest review', error);
    return NextResponse.json({ success: false, error: 'Failed to update review status' }, { status: 500 });
  }
}
