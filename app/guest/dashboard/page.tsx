import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import { authOptions } from '@/lib/auth';
import BookingActionButton from '@/components/booking/BookingActionButton';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import Property from '@/models/Property';
import Review from '@/models/Review';
import GuestReviewForm from '@/components/reviews/GuestReviewForm';

export default async function GuestDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; payment?: string; whatsapp?: string }>;
}) {
  const { booking: bookingNotice, payment: paymentNotice, whatsapp: whatsappNotice } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'guest') {
    redirect(session.user.role === 'host' ? '/host/dashboard' : '/admin/dashboard');
  }

  await dbConnect();
  const bookings = await Booking.find({ guest: session.user.id })
    .select('property checkInDate checkOutDate status priceBreakdown createdAt')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const properties = bookings.length
    ? await Property.find({ _id: { $in: bookings.map((booking) => booking.property) } })
        .select('name area')
        .lean()
    : [];
  const payments = bookings.length
    ? await Payment.find({ user: session.user.id, booking: { $in: bookings.map((booking) => booking._id) } })
        .select('booking status')
        .lean()
    : [];
  const reviews = bookings.length
    ? await Review.find({ guest: session.user.id, booking: { $in: bookings.map((booking) => booking._id) } })
        .select('booking status rating comment hostResponse')
        .lean()
    : [];
  const propertyById = new Map(properties.map((property) => [property._id.toString(), property]));
  const paymentByBookingId = new Map(payments.map((payment) => [payment.booking.toString(), payment]));
  const reviewByBookingId = new Map(reviews.map((review) => [review.booking.toString(), review]));

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Guest Dashboard</h1>
              <p className="mt-2 text-slate-600">
                Welcome, {session.user.name || 'Guest'}. View and manage your stays here.
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center justify-center rounded-lg bg-[#0b2f4d] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0e3d61]"
            >
              Find a place to stay
            </Link>
          </div>

          {bookingNotice === 'requested' && (
            <p role="status" className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Your booking request was sent to the host. You can track its status below.
            </p>
          )}
          {bookingNotice === 'requested' && whatsappNotice === 'sent' && (
            <p role="status" className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              WhatsApp booking updates were sent to you and the host.
            </p>
          )}
          {bookingNotice === 'requested' && whatsappNotice === 'guest-opted-out' && (
            <p role="status" className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              The host was notified on WhatsApp. You did not opt in to receive a copy of the update.
            </p>
          )}
          {bookingNotice === 'requested' && whatsappNotice === 'host-opted-out' && (
            <p role="status" className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Your WhatsApp update was sent. The host has not opted in to WhatsApp booking notifications.
            </p>
          )}
          {bookingNotice === 'requested' && whatsappNotice === 'no-opt-ins' && (
            <p role="status" className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              No WhatsApp messages were sent because neither you nor the host opted in.
            </p>
          )}
          {bookingNotice === 'requested' && whatsappNotice === 'setup' && (
            <p role="status" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Your booking was created, but WhatsApp messaging is not configured yet.
            </p>
          )}
          {bookingNotice === 'requested' && whatsappNotice === 'failed' && (
            <p role="status" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Your booking was created, but one or more WhatsApp messages could not be sent. Check the guest and host phone numbers.
            </p>
          )}
          {paymentNotice === 'success' && (
            <p role="status" className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Your payment was approved. Your booking details are below.
            </p>
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                My Bookings <span className="text-slate-500">({bookings.length})</span>
              </h2>
            </div>
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <p className="text-sm text-slate-500">You don’t have any bookings yet.</p>
                <Link
                  href="/properties"
                  className="mt-4 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Explore available stays
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {bookings.map((booking) => {
                  const property = propertyById.get(booking.property.toString());
                  const payment = paymentByBookingId.get(booking._id.toString());
                  return (
                    <li
                      key={booking._id.toString()}
                      className="px-6 py-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-slate-900">
                            {property?.name || 'Property details unavailable'}
                          </h3>
                          {property?.area && <p className="mt-1 text-sm text-slate-600">{property.area}</p>}
                          <p className="mt-1 text-sm text-slate-600">
                            {booking.checkInDate.toLocaleDateString()} – {booking.checkOutDate.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold text-slate-900">
                          ₹{booking.priceBreakdown.total.toLocaleString('en-IN')}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                          {booking.status}
                        </span>
                        {booking.status === 'confirmed' && payment?.status === 'success' && (
                          <span className="text-xs font-semibold text-emerald-700">Paid</span>
                        )}
                        {booking.status === 'confirmed' && payment?.status === 'pending' && (
                          <span className="text-xs font-semibold text-amber-700">Payment pending</span>
                        )}
                        {booking.status === 'confirmed' && payment?.status === 'pending' && (
                          <span className="text-xs text-slate-500">Cancellation is paused while payment is checked.</span>
                        )}
                        {booking.status === 'confirmed' && payment?.status === 'refunded' && (
                          <span className="text-xs font-semibold text-slate-600">Refunded</span>
                        )}
                        {booking.status === 'confirmed' && payment?.status === 'partially_refunded' && (
                          <span className="text-xs font-semibold text-slate-600">Partially refunded</span>
                        )}
                        {booking.status === 'confirmed' &&
                          (!payment || payment.status === 'failed') && (
                          <Link
                            href={`/guest/pay/${booking._id.toString()}`}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            Pay now
                          </Link>
                        )}
                        {booking.status === 'confirmed' && payment?.status === 'success' && (
                          <span className="text-xs text-slate-500">Contact support to request cancellation; refunds are not automated.</span>
                        )}
                        {['pending', 'confirmed'].includes(booking.status) &&
                          booking.checkInDate > new Date() &&
                          payment?.status !== 'success' &&
                          payment?.status !== 'pending' && (
                          <BookingActionButton
                            bookingId={booking._id.toString()}
                            action="cancel"
                            label={booking.status === 'pending' ? 'Cancel request' : 'Cancel booking'}
                            tone="danger"
                          />
                        )}
                        </div>
                      </div>
                      {property && ['confirmed', 'completed'].includes(booking.status) && booking.checkOutDate <= new Date() && (
                        <GuestReviewForm
                          bookingId={booking._id.toString()}
                          propertyName={property.name}
                          existingReview={reviewByBookingId.has(booking._id.toString())
                            ? {
                                status: reviewByBookingId.get(booking._id.toString())!.status,
                                rating: reviewByBookingId.get(booking._id.toString())!.rating,
                                comment: reviewByBookingId.get(booking._id.toString())!.comment,
                                hostResponse: reviewByBookingId.get(booking._id.toString())!.hostResponse || '',
                              }
                            : undefined}
                        />
                      )}
                      {['confirmed', 'completed'].includes(booking.status) && booking.checkOutDate > new Date() && (
                        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                          You can review this stay after checkout on {booking.checkOutDate.toLocaleDateString()}.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
