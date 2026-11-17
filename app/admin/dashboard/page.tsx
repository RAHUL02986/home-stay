import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import HomepageBanner from '@/models/HomepageBanner';
import Property from '@/models/Property';
import Review from '@/models/Review';
import Room from '@/models/Room';
import '@/models/User';
import HomepageBannerForm from './HomepageBannerForm';
import AdminPropertyQueue from './AdminPropertyQueue';
import AdminReviewQueue from './AdminReviewQueue';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'admin') {
    redirect(session.user.role === 'host' ? '/host/dashboard' : '/guest/dashboard');
  }

  await dbConnect();
  const [pending, pendingReviews, approvedProperties, bannerSettings] = await Promise.all([
    Property.find({ status: 'pending' })
      .populate('host', 'name email')
      .sort({ createdAt: 1 })
      .lean(),
    Review.find({ status: 'pending' })
      .populate('guest', 'name')
      .populate('property', 'name')
      .sort({ createdAt: 1 })
      .lean(),
    Property.find({ status: 'approved' }).select('name area').sort({ name: 1 }).lean(),
    HomepageBanner.findOne({ key: 'homepage' }).populate('property', 'name area status').lean(),
  ]);

  const approvedPropertyIds = approvedProperties.map((property) => property._id);
  const availableRooms = approvedPropertyIds.length
    ? await Room.find({ property: { $in: approvedPropertyIds }, availability: 'available' })
        .select('property pricePerNight')
        .lean()
    : [];
  const priceByProperty = new Map<string, number>();
  for (const room of availableRooms) {
    const propertyId = room.property.toString();
    const currentPrice = priceByProperty.get(propertyId);
    if (currentPrice === undefined || room.pricePerNight < currentPrice) {
      priceByProperty.set(propertyId, room.pricePerNight);
    }
  }
  const bannerProperties = approvedProperties.map((property) => ({
    id: property._id.toString(),
    name: property.name,
    area: property.area,
    minPrice: priceByProperty.get(property._id.toString()),
  }));
  const configuredProperty = bannerSettings?.property as unknown as {
    _id?: unknown;
    status?: string;
  } | null;
  const configuredPropertyId =
    configuredProperty?.status === 'approved' ? String(configuredProperty._id) : '';
  const currentBannerProperty = bannerProperties.find((property) => property.id === configuredPropertyId);
  const initialBannerSettings = currentBannerProperty && bannerSettings
    ? {
        propertyId: currentBannerProperty.id,
        eyebrow: bannerSettings.eyebrow,
        badge: bannerSettings.badge,
        titleOverride: bannerSettings.titleOverride,
        areaOverride: bannerSettings.areaOverride,
        priceOverride: bannerSettings.priceOverride,
        ratingOverride: bannerSettings.ratingOverride,
      }
    : null;

  const properties = pending.map((property) => {
    const host = property.host as unknown as { name?: string; email?: string } | null;
    return {
      id: property._id.toString(),
      name: property.name,
      description: property.description,
      propertyType: property.propertyType,
      area: property.area,
      address: property.address,
      amenities: property.amenities,
      images: property.images,
      submittedAt: property.createdAt.toISOString(),
      hostName: host?.name || 'Unknown host',
      hostEmail: host?.email || '',
    };
  });
  const reviews = pendingReviews.map((review) => {
    const guest = review.guest as unknown as { name?: string } | null;
    const property = review.property as unknown as { name?: string } | null;
    return {
      id: review._id.toString(),
      guestName: guest?.name || 'Guest',
      propertyName: property?.name || 'Property unavailable',
      rating: review.rating,
      comment: review.comment,
      submittedAt: review.createdAt.toISOString(),
    };
  });

  return (
    <main className="min-h-[60vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Welcome, {session.user.name || 'Admin'}. Review host listings and guest feedback here.
          </p>
        </div>
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Homepage hero banner</h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose an approved property and customize how it appears in the homepage banner.
            </p>
          </div>
          <HomepageBannerForm properties={bannerProperties} initialSettings={initialBannerSettings} />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Pending property reviews</h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              {properties.length} pending
            </span>
          </div>
          <AdminPropertyQueue properties={properties} />
        </section>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Pending guest reviews</h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              {reviews.length} pending
            </span>
          </div>
          <AdminReviewQueue reviews={reviews} />
        </section>
      </div>
    </main>
  );
}
