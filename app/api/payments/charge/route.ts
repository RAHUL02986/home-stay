import { randomBytes } from 'node:crypto';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  createAuthorizeNetCharge,
  getAuthorizeNetConfig,
  getAuthorizeNetFailureDetails,
  isApprovedAuthorizeNetResult,
} from '@/lib/authorizenet';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';

const chargeSchema = z.object({
  bookingId: z.string().regex(/^[a-f\d]{24}$/i),
  opaqueData: z.object({
    dataDescriptor: z.string().min(1).max(100),
    dataValue: z.string().min(1).max(2048),
  }),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Please sign in to pay for this booking' }, { status: 401 });
  }
  if (session.user.role !== 'guest') {
    return NextResponse.json({ success: false, error: 'Only guests can pay for bookings' }, { status: 403 });
  }

  const config = getAuthorizeNetConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: 'Authorize.Net Sandbox is not configured. Set its server environment variables and restart the app.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }
  const parsed = chargeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid payment details' }, { status: 400 });
  }
  if (parsed.data.opaqueData.dataDescriptor !== 'COMMON.ACCEPT.INAPP.PAYMENT') {
    return NextResponse.json({ success: false, error: 'Invalid Authorize.Net payment token' }, { status: 400 });
  }

  try {
    await dbConnect();
    const booking = await Booking.findOne({
      _id: parsed.data.bookingId,
      guest: session.user.id,
      status: 'confirmed',
    }).lean();
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Confirmed booking not found' }, { status: 404 });
    }

    const amount = booking.priceBreakdown.total;
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Booking amount is invalid' }, { status: 400 });
    }

    const referenceId = randomBytes(10).toString('hex');
    let payment = await Payment.findOneAndUpdate(
      { booking: booking._id, status: 'failed' },
      {
        $set: {
          status: 'pending',
          amount,
          currency: config.currency,
          method: 'authorizenet',
          gatewayResponse: {},
          authorizeNetReferenceId: referenceId,
        },
      },
      { returnDocument: 'after' }
    );
    if (!payment) {
      const existing = await Payment.findOne({ booking: booking._id }).select('status').lean();
      if (existing?.status === 'success' || existing?.status === 'refunded' || existing?.status === 'partially_refunded') {
        return NextResponse.json({ success: false, error: 'A payment is already recorded for this booking' }, { status: 409 });
      }
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'A payment attempt is already pending. Do not retry; contact support if it does not resolve.' },
          { status: 409 }
        );
      }
      try {
        payment = await Payment.create({
          booking: booking._id,
          user: session.user.id,
          amount,
          currency: config.currency,
          status: 'pending',
          method: 'authorizenet',
          authorizeNetReferenceId: referenceId,
        });
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
          return NextResponse.json({ success: false, error: 'A payment attempt already exists for this booking' }, { status: 409 });
        }
        throw error;
      }
    }

    const lockedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'confirmed' },
      { $set: { paymentInProgress: true } },
      { returnDocument: 'after' }
    );
    if (!lockedBooking) {
      payment.status = 'failed';
      payment.gatewayResponse = { error: 'Booking was no longer confirmed before payment processing' };
      await payment.save();
      return NextResponse.json({ success: false, error: 'This booking is no longer available for payment' }, { status: 409 });
    }

    let gatewayResult;
    try {
      gatewayResult = await createAuthorizeNetCharge({
        apiLoginId: config.apiLoginId,
        transactionKey: config.transactionKey,
        amount,
        invoiceNumber: booking._id.toString().slice(-20),
        referenceId,
        email: session.user.email || '',
        opaqueData: parsed.data.opaqueData,
      });
    } catch (error) {
      console.error('Authorize.Net charge could not be confirmed', error);
      return NextResponse.json(
        { success: false, error: 'The payment result could not be confirmed. Do not retry this payment until support checks its status.' },
        { status: 502 }
      );
    }

    const response = gatewayResult.transactionResponse;
    const approved = isApprovedAuthorizeNetResult(gatewayResult);
    payment.gatewayResponse = {
      resultCode: gatewayResult.messages?.resultCode || '',
      responseCode: response?.responseCode || '',
      transactionId: response?.transId || '',
      responseMessages: (response?.messages || []).map((message) => ({
        code: message.code || '',
        description: message.description || '',
      })),
      errors: (response?.errors || []).map((entry) => ({
        code: entry.errorCode || '',
        text: entry.errorText || '',
      })),
    };
    payment.status = approved ? 'success' : 'failed';
    if (response?.transId) {
      payment.authorizeNetTransactionId = response.transId;
    }
    await payment.save();
    await Booking.updateOne({ _id: booking._id, paymentInProgress: true }, { $set: { paymentInProgress: false } });

    if (!approved) {
      const failure = getAuthorizeNetFailureDetails(gatewayResult);
      console.error('Authorize.Net payment not approved', failure);
      return NextResponse.json(
        {
          success: false,
          error: 'Authorize.Net did not approve this payment.',
          gateway: failure,
        },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { transactionId: response?.transId, status: payment.status },
      message: 'Payment approved',
    });
  } catch (error) {
    console.error('Failed to process Authorize.Net payment', error);
    return NextResponse.json({ success: false, error: 'Failed to process payment' }, { status: 500 });
  }
}
