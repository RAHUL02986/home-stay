import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';

interface AuthorizeNetWebhook {
  eventType?: string;
  webhookId?: string;
  payload?: {
    id?: string | number;
    responseCode?: number | string;
    authAmount?: number;
    authCode?: string;
    merchantReferenceId?: string;
  };
}

export async function POST(req: NextRequest) {
  const signatureKey = process.env.AUTHNET_SIGNATURE_KEY;
  const signatureHeader = req.headers.get('x-anet-signature') || '';
  if (!signatureKey || !/^[a-f\d]{128}$/i.test(signatureKey)) {
    return NextResponse.json({ success: false, error: 'Webhook is not configured' }, { status: 503 });
  }

  const [scheme, signature] = signatureHeader.split('=');
  if (scheme?.toLowerCase() !== 'sha512' || !signature || !/^[a-f\d]{128}$/i.test(signature)) {
    return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 401 });
  }

  const rawBody = await req.text();
  const expected = createHmac('sha512', Buffer.from(signatureKey, 'hex'))
    .update(rawBody, 'utf8')
    .digest();
  const provided = Buffer.from(signature, 'hex');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 401 });
  }

  let event: AuthorizeNetWebhook;
  try {
    event = JSON.parse(rawBody) as AuthorizeNetWebhook;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid webhook body' }, { status: 400 });
  }

  const transactionId = event.payload?.id;
  if (!transactionId || !event.eventType) {
    return NextResponse.json({ success: true, message: 'Event acknowledged' });
  }

  try {
    await dbConnect();
    const transaction = String(transactionId);
    if (event.eventType === 'net.authorize.payment.authcapture.created') {
      const responseCode = event.payload?.responseCode;
      if (!['1', '2', '3'].includes(String(responseCode))) {
        return NextResponse.json({ success: true, message: 'Event acknowledged' });
      }
      const status = String(responseCode) === '1' ? 'success' : 'failed';
      const referenceId = event.payload?.merchantReferenceId;
      const payment = await Payment.findOneAndUpdate(
        {
          $or: [
            ...(referenceId ? [{ authorizeNetReferenceId: referenceId }] : []),
            { authorizeNetTransactionId: transaction },
          ],
        },
        {
          $set: {
            status,
            authorizeNetTransactionId: transaction,
            gatewayResponse: {
              webhookEvent: event.eventType,
              responseCode: event.payload?.responseCode,
              authAmount: event.payload?.authAmount,
              authCode: event.payload?.authCode,
            },
          },
        },
        { new: true }
      );
      if (payment) {
        await Booking.updateOne(
          { _id: payment.booking, paymentInProgress: true },
          { $set: { paymentInProgress: false } }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process Authorize.Net webhook', error);
    return NextResponse.json({ success: false, error: 'Failed to process webhook' }, { status: 500 });
  }
}
