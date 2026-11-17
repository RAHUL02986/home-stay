import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const emailSchema = z.string().email();

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  const providedSecret = req.headers.get('x-admin-bootstrap-secret');
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator';

  if (!expectedSecret || expectedSecret.length < 32 || !email || !password || password.length < 12) {
    return NextResponse.json(
      { success: false, error: 'Admin bootstrap is not securely configured' },
      { status: 503 }
    );
  }

  if (
    !providedSecret ||
    Buffer.byteLength(providedSecret) !== Buffer.byteLength(expectedSecret) ||
    !timingSafeEqual(Buffer.from(providedSecret), Buffer.from(expectedSecret))
  ) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return NextResponse.json({ success: false, error: 'ADMIN_EMAIL is invalid' }, { status: 503 });
  }

  try {
    await dbConnect();
    if (await User.exists({ role: 'admin' })) {
      return NextResponse.json({ success: false, error: 'An admin account already exists' }, { status: 409 });
    }

    if (await User.exists({ email })) {
      return NextResponse.json(
        { success: false, error: 'ADMIN_EMAIL is already registered; no account was changed' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      isVerified: true,
    });

    return NextResponse.json(
      { success: true, message: 'Admin account created. Sign in using the configured admin email and password.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to bootstrap admin account', error);
    return NextResponse.json({ success: false, error: 'Failed to create admin account' }, { status: 500 });
  }
}
