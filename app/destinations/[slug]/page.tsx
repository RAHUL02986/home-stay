import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/listing/PropertyCard';
import dbConnect from '@/lib/dbConnect';
import { getDestination } from '@/lib/destinations';
import { isDormitoryRoom } from '@/lib/roomPricing';
import Property from '@/models/Property';
import Room from '@/models/Room';

export const dynamic = 'force-dynamic';

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
}

const getDestinationProperties = cache(async (area: string) => {
  await dbConnect();
  const properties = await Property.find({ status: 'approved', area })
    .select('name area propertyType images amenities')
    .sort({ name: 1 })
    .lean();
  const propertyIds = properties.map((property) => property._id);
  const rooms = propertyIds.length
    ? await Room.find({ property: { $in: propertyIds }, availability: 'available' })
        .select('property pricePerNight type images')
        .lean()
    : [];
  const roomData = new Map<string, { price: number; isPerPerson: boolean; image?: string }>();

  for (const room of rooms) {
    const propertyId = room.property.toString();
    const current = roomData.get(propertyId);
    if (!current || room.pricePerNight < current.price) {
      roomData.set(propertyId, {
        price: room.pricePerNight,
        isPerPerson: isDormitoryRoom(room.type),
        image: room.images?.[0],
      });
    } else if (!current.image && room.images?.[0]) {
      roomData.set(propertyId, { ...current, image: room.images[0] });
    }
  }

  return properties.map((property) => {
    const room = roomData.get(property._id.toString());
    return {
      _id: property._id.toString(),
      name: property.name,
      area: property.area,
      propertyType: property.propertyType,
      images: property.images?.length
        ? property.images
        : room?.image
          ? [room.image]
          : [],
      amenities: property.amenities,
      minPrice: room?.price,
      minPriceIsPerPerson: room?.isPerPerson,
    };
  });
});

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = getDestination(slug);
  if (!destination) {
    return {
      title: 'Destination not found',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Homestays in ${destination.name}, Dharamshala`,
    description: `${destination.description} Browse approved homestays and hotels in ${destination.name}, Dharamshala.`.slice(
      0,
      160
    ),
    alternates: { canonical: `/destinations/${destination.slug}` },
    openGraph: {
      title: `Homestays in ${destination.name}, Dharamshala`,
      description: destination.description,
      type: 'website',
    },
  };
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const destination = getDestination(slug);
  if (!destination) notFound();

  const properties = await getDestinationProperties(destination.name);

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/destinations" className="hover:text-emerald-700">
            Destinations
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{destination.name}</span>
        </nav>
        <header className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Dharamshala, Himachal Pradesh
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Homestays and hotels in {destination.name}
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">
            {destination.description} Compare approved local stays and room details before you plan your trip.
          </p>
        </header>

        <section aria-labelledby="destination-stays-heading">
          <h2 id="destination-stays-heading" className="mb-5 text-xl font-semibold">
            {properties.length
              ? `${properties.length} ${properties.length === 1 ? 'stay' : 'stays'} in ${destination.name}`
              : `Explore stays in ${destination.name}`}
          </h2>
          {properties.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property._id} {...property} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-slate-700">
                There are no approved listings in this area yet. Browse all Dharamshala stays or check
                back later.
              </p>
              <Link
                href="/properties"
                className="mt-4 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Browse all stays
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
