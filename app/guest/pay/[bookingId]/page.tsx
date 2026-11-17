import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import AuthorizeNetCheckout from '@/components/booking/AuthorizeNetCheckout';
import Footer from '@/components/layout/Footer';
import { getAuthorizeNetConfig } from '@/lib/authorizenet';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';

export default async function GuestPaymentPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'guest') redirect('/guest/dashboard');
  if (!/^[a-f\d]{24}$/i.test(bookingId)) notFound();

  await dbConnect();
  const booking = await Booking.findOne({
    _id: bookingId,
    guest: session.user.id,
  }).select('status priceBreakdown').lean();
  if (!booking) notFound();
  if (booking.status !== 'confirmed') redirect('/guest/dashboard');

  const payment = await Payment.findOne({ booking: booking._id }).select('status').lean();
  const config = getAuthorizeNetConfig();

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <main className="flex-1">
        <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
          <Link href="/guest/dashboard" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            ← Back to my bookings
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Complete your payment</h1>
          <p className="mt-2 text-sm text-slate-600">Your host confirmed this booking. Pay securely to complete your reservation.</p>

          {payment?.status === 'success' ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <h2 className="font-semibold">This booking is already paid</h2>
              <p className="mt-1 text-sm">Your payment was approved. You can review it in your booking history.</p>
            </div>
          ) : payment?.status === 'pending' ? (
            <div role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <h2 className="font-semibold">Payment status needs to be checked</h2>
              <p className="mt-1 text-sm">A payment attempt is still pending. Do not retry; contact support to confirm its status.</p>
            </div>
          ) : payment?.status === 'refunded' || payment?.status === 'partially_refunded' ? (
            <div role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <h2 className="font-semibold">A refund is recorded for this booking</h2>
              <p className="mt-1 text-sm">Contact support if you need help with the payment. Another charge cannot be started here.</p>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">Booking total</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  ₹{booking.priceBreakdown.total.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="mt-5">
                {config ? (
                  <AuthorizeNetCheckout
                    bookingId={booking._id.toString()}
                    apiLoginId={config.apiLoginId}
                    clientKey={config.clientKey}
                    amount={booking.priceBreakdown.total}
                    currency={config.currency}
                  />
                ) : (
                  <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                    Authorize.Net Sandbox is not configured. Add the required environment variables described in the README
                    and restart the app. Do not use the exposed keys from chat; rotate them first.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
