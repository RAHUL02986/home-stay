import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import Review from '@/models/Review';
import '@/models/Room';
import HostBookingRequests from '@/components/booking/HostBookingRequests';
import HostReviewReplies from '@/components/reviews/HostReviewReplies';

export default async function HostDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'host') {
    redirect(session.user.role === 'admin' ? '/admin/dashboard' : '/guest/dashboard');
  }

  await dbConnect();
  const properties = await Property.find({ host: session.user.id })
    .select('name area status propertyType images createdAt')
    .sort({ createdAt: -1 })
    .lean();
  const propertyIds = properties.map((property) => property._id);
  const bookingRecords = propertyIds.length
    ? await Booking.find({ property: { $in: propertyIds } })
        .populate('property', 'name')
        .populate('room', 'type')
        .populate('guest', 'name email')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
    : [];
  const reviewRecords = propertyIds.length
    ? await Review.find({ property: { $in: propertyIds }, status: 'approved' })
        .select('property guest rating comment hostResponse createdAt')
        .populate('property', 'name')
        .populate('guest', 'name')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
    : [];
  const reviews = reviewRecords.map((review) => {
    const property = review.property as unknown as { name?: string } | null;
    const guest = review.guest as unknown as { name?: string } | null;
    return {
      id: review._id.toString(),
      propertyName: property?.name || 'Property',
      guestName: guest?.name || 'Guest',
      rating: review.rating,
      comment: review.comment,
      hostResponse: review.hostResponse || '',
      createdAt: review.createdAt.toLocaleDateString(),
    };
  });
  const bookings = bookingRecords.map((booking) => {
    const property = booking.property as unknown as { name?: string } | null;
    const room = booking.room as unknown as { type?: string } | null;
    const guest = booking.guest as unknown as { name?: string; email?: string } | null;
    return {
      id: booking._id.toString(),
      propertyName: property?.name || 'Property',
      roomType: room?.type || 'Room',
      guestName: guest?.name || booking.travelerDetails.fullName,
      guestEmail: guest?.email || booking.travelerDetails.email,
      checkIn: booking.checkInDate.toLocaleDateString(),
      checkOut: booking.checkOutDate.toLocaleDateString(),
      guests: booking.numberOfGuests,
      rooms: booking.numberOfRooms,
      status: booking.status,
      total: booking.priceBreakdown.total,
    };
  });

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Host Dashboard</h1>
              <p className="mt-2 text-slate-600">
                Welcome, {session.user.name || 'Host'}. Manage your property listings here.
              </p>
            </div>
            <Link
              href="/host/new-property"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + List a New Property
            </Link>
          </div>

          <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Booking requests and reservations
              </h2>
            </div>
            <HostBookingRequests bookings={bookings} />
          </section>

          <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Guest reviews and your replies
              </h2>
            </div>
            <HostReviewReplies reviews={reviews} />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                My Listings <span className="text-slate-500">({properties.length})</span>
              </h2>
            </div>
            {properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <p className="text-sm text-slate-500">You haven’t listed any properties yet.</p>
                <Link
                  href="/host/new-property"
                  className="mt-4 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Create your first listing
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {properties.map((property) => (
                  <li
                    key={property._id.toString()}
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">{property.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {property.area} · {property.propertyType.replace(/[-_]/g, ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          property.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : property.status === 'rejected' || property.status === 'suspended'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {property.status}
                      </span>
                      {property.status === 'approved' && (
                        <Link
                          href={`/properties/${property._id.toString()}`}
                          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                        >
                          View listing
                        </Link>
                      )}
                      <Link
                        href={`/host/properties/${property._id.toString()}`}
                        className="text-sm font-medium text-slate-700 hover:text-slate-900"
                      >
                        Manage
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
