import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Property from '@/models/Property';

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Choose approve or reject' }, { status: 400 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid property ID' }, { status: 400 });
    }

    const property = await Property.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { $set: { status: parsed.data.status } },
      { new: true, runValidators: true }
    ).select('name status');

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Pending property not found; it may already have been reviewed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { name: property.name, status: property.status } });
  } catch (error) {
    console.error('Failed to review property', error);
    return NextResponse.json({ success: false, error: 'Failed to review property' }, { status: 500 });
  }
}
