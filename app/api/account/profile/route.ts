import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().max(30, 'Phone number is too long').optional(),
  whatsappBookingOptIn: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Please sign in to update your profile' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid profile data' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const updates = {
      name: parsed.data.name,
      phone: parsed.data.phone || '',
      ...(session.user.role === 'host'
        ? { whatsappBookingOptIn: parsed.data.whatsappBookingOptIn === true }
        : {}),
    };
    const user = await User.findByIdAndUpdate(
      session.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('name email phone whatsappBookingOptIn');

    if (!user) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        whatsappBookingOptIn: user.whatsappBookingOptIn === true,
      },
    });
  } catch (error) {
    console.error('Failed to update profile', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
