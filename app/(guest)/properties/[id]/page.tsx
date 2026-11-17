import { cache } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import mongoose from 'mongoose';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { MapPin, Users, CheckCircle } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import BookingRequestForm from '@/components/booking/BookingRequestForm';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Property from '@/models/Property';
import Review from '@/models/Review';
import Room from '@/models/Room';
import User from '@/models/User';
import { isDormitoryRoom } from '@/lib/roomPricing';
import { absoluteUrl } from '@/lib/seo';

// This page depends on request-time database data, so it is rendered
// dynamically on every request instead of being prerendered at build time.
export const dynamic = 'force-dynamic';

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

const getApprovedProperty = cache(async (id: string) => {
  if (!mongoose.isValidObjectId(id)) return null;

  await dbConnect();
  return Property.findOne({ _id: id, status: 'approved' })
    .populate('host', 'name email profileImage')
    .lean();
});

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getApprovedProperty(id);

  if (!property) {
    return {
      title: 'Stay not found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${property.name} in ${property.area}`;
  const description =
    property.description.replace(/\s+/g, ' ').trim().slice(0, 160) ||
    `View rooms, amenities, and location details for ${property.name} in ${property.area}, Dharamshala.`;
  const image = property.images?.[0] || '/opengraph-image';

  return {
    title,
    description,
    alternates: { canonical: `/properties/${id}` },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: DetailPageProps) {
  const { id } = await params;
  const property = await getApprovedProperty(id);
  if (!property) notFound();

  const rooms = await Room.find({ property: id })
    .sort({ pricePerNight: 1 })
    .lean();

  const reviewRecords = await Review.find({
    property: property._id,
    status: { $in: ['approved', 'pending'] },
  })
    .select('guest rating comment hostResponse hostRespondedAt createdAt')
    .populate('guest', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const reviews = reviewRecords.map((review) => {
    const guest = review.guest as unknown as { name?: string } | null;
    return {
      id: review._id.toString(),
      guestName: guest?.name || 'Guest',
      rating: review.rating,
      comment: review.comment,
      hostResponse: review.hostResponse || '',
    };
  });

  const lowestPricedRoom = rooms.reduce<(typeof rooms)[number] | undefined>(
    (lowest, room) => !lowest || room.pricePerNight < lowest.pricePerNight ? room : lowest,
    undefined
  );
  const minPrice = lowestPricedRoom?.pricePerNight;
  const minPriceIsPerPerson = lowestPricedRoom ? isDormitoryRoom(lowestPricedRoom.type) : false;
  const coordinates = property.coordinates &&
    Number.isFinite(property.coordinates.lat) &&
    Number.isFinite(property.coordinates.lng) &&
    property.coordinates.lat >= -90 &&
    property.coordinates.lat <= 90 &&
    property.coordinates.lng >= -180 &&
    property.coordinates.lng <= 180
      ? property.coordinates
      : null;
  const locationMapSrc = coordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(coordinates.lng - 0.015).toFixed(5)}%2C${(coordinates.lat - 0.01).toFixed(5)}%2C${(coordinates.lng + 0.015).toFixed(5)}%2C${(coordinates.lat + 0.01).toFixed(5)}&layer=mapnik&marker=${coordinates.lat.toFixed(5)}%2C${coordinates.lng.toFixed(5)}`
    : null;
  const locationSearchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(
    `${property.address}, ${property.area}, Dharamshala`
  )}`;
  const propertyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.name,
    description: property.description,
    url: absoluteUrl(`/properties/${id}`),
    image: property.images,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.area,
      addressRegion: 'Himachal Pradesh',
      addressCountry: 'IN',
    },
    ...(coordinates
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: coordinates.lat,
            longitude: coordinates.lng,
          },
        }
      : {}),
  };
  const session = await getServerSession(authOptions);
  const guest = session?.user?.role === 'guest'
    ? await User.findById(session.user.id).select('name phone').lean()
    : null;

  return (
    <div className="flex flex-col min-h-svh bg-white">
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(propertyJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <section className="relative h-[640px] w-full bg-slate-100 overflow-hidden">
        {(property.images?.[0] ? (
          <Image
            src={property.images[0]}
            alt={property.name}
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-200 text-slate-400 text-sm">
            No images available
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 w-full">
          {property.propertyType && (
            <span className="inline-block px-3 py-1 rounded-full bg-white/90 text-slate-900 text-xs font-semibold mb-3">
              {property.propertyType}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            {property.name}
          </h1>
          <div className="flex items-center gap-3 text-white">
            <MapPin size={18} className="text-emerald-400" />
            <span className="text-lg">{property.area}</span>
          </div>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <p className="text-lg text-slate-700 leading-relaxed">
                {property.description}
              </p>
              <div className="pt-4 border-t border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-3">
                  Amenities
                </h2>
                <div className="flex flex-wrap gap-3">
                  {(property.amenities || []).map((amenity) => (
                    <span
                      key={amenity}
                      className="px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Rooms</h2>
              {rooms.length === 0 ? (
                <p className="text-slate-500 text-sm">No rooms available.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="px-4 py-3 text-left font-semibold">Type</th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Max guests
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Availability
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">Features</th>
                        <th className="px-4 py-3 text-left font-semibold">Room photos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => (
                        <tr
                          key={room._id.toString()}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-3 text-slate-800 font-medium">
                            {room.type}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-600 font-semibold">
                              ₹{room.pricePerNight}
                              {isDormitoryRoom(room.type) ? ' / person / night' : ' / night'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <Users size={16} /> {room.maxGuests}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              room.availability === 'available'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {room.availability === 'available' ? (
                                <>
                                  <CheckCircle size={12} /> Available
                                </>
                              ) : (
                                'Unavailable'
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {(room.features || []).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {room.images?.length ? (
                              <div className="flex items-center gap-2">
                                {room.images.slice(0, 3).map((image, imageIndex) => (
                                  <a
                                    key={`${image}-${imageIndex}`}
                                    href={image}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Open ${room.type} photo ${imageIndex + 1}`}
                                    className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-slate-200"
                                  >
                                    <Image
                                      src={image}
                                      alt={`${room.type} photo ${imageIndex + 1}`}
                                      fill
                                      unoptimized
                                      sizes="64px"
                                      className="object-cover"
                                    />
                                  </a>
                                ))}
                                {room.images.length > 3 && (
                                  <span className="text-xs text-slate-500">+{room.images.length - 3}</span>
                                )}
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {minPrice !== undefined && (
                <p className="mt-4 text-sm font-semibold text-slate-900">
                  Starting from{' '}
                  <span className="text-emerald-600">₹{minPrice}</span>
                  {minPriceIsPerPerson ? ' / person / night' : ' / night'}
                </p>
              )}
            </div>
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Guest reviews</h2>
              {reviews.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No guest reviews yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-200">
                  {reviews.map((review) => (
                    <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                      <p className="text-sm font-semibold text-amber-700" aria-label={`${review.rating} out of 5 stars`}>
                        {review.rating}/5 stars
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{review.comment}</p>
                      <p className="mt-2 text-xs font-medium text-slate-500">By {review.guestName}</p>
                      {review.hostResponse && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Host reply</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{review.hostResponse}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-slate-900">
                  {minPrice !== undefined ? `₹${minPrice}` : 'Contact'}
                </span>
                <span className="text-sm text-slate-500 font-medium">
                  {minPriceIsPerPerson ? '/ person / night' : '/ night'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Starting price across all room types
              </p>
              {session?.user?.role === 'guest' && (
                <BookingRequestForm
                  propertyId={property._id.toString()}
                  rooms={rooms.map((room) => ({
                    id: room._id.toString(),
                    type: room.type,
                    pricePerNight: room.pricePerNight,
                    maxGuests: room.maxGuests,
                    totalRooms: room.totalRooms,
                    availability: room.availability,
                    minStay: room.minStay,
                    maxStay: room.maxStay,
                    advanceBookingDays: room.advanceBookingDays,
                  }))}
                  user={{ name: guest?.name || session.user.name || '', phone: guest?.phone || '' }}
                />
              )}
              {!session?.user && (
                <Link
                  href="/auth/login"
                  className="mt-5 block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Sign in to request a booking
                </Link>
              )}
              {session?.user && session.user.role !== 'guest' && (
                <p className="mt-5 text-sm text-slate-500">
                  Booking requests are available to guest accounts.
                </p>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Location
              </h2>
              <p className="text-sm text-slate-700 mb-3">{property.address}</p>
              <p className="text-sm text-slate-700 mb-4">{property.area}, Dharamshala</p>
              {locationMapSrc ? (
                <iframe
                  title={`Map showing ${property.name}`}
                  src={locationMapSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-48 w-full rounded-lg border border-slate-200"
                />
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                  <MapPin size={22} className="mb-2 text-slate-400" />
                  <p className="text-sm text-slate-600">Map coordinates haven’t been added for this property.</p>
                  <Link
                    href={locationSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Search this address on OpenStreetMap
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
          {(property.images?.[1] || property.images?.[0]) && (
            <Image
              src={property.images[1] || property.images[0]}
              alt="Host"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-sm font-bold text-slate-900">
              Hosted by {((property.host as { name?: string } | null)?.name || 'A local host')}
            </p>
            <p className="text-xs text-slate-500">{((property.host as { email?: string } | null)?.email || '')}</p>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}