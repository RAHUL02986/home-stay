import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import PropertyListing from '@/components/listing/PropertyListing';
import dbConnect from '@/lib/dbConnect';
import { isDormitoryRoom } from '@/lib/roomPricing';
import Property from '@/models/Property';
import Room from '@/models/Room';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Homestays and Hotels in Dharamshala',
  description:
    'Browse homestays, hotels, and guest houses in Dharamshala, McLeodganj, Dharamkot, Naddi, and Bhagsu.',
  alternates: { canonical: '/properties' },
};

export default async function PropertiesPage() {
  await dbConnect();
  const query = { status: 'approved' as const };
  const [records, total] = await Promise.all([
    Property.find(query)
      .sort({ createdAt: -1 })
      .limit(12)
      .select('name area propertyType images amenities')
      .lean(),
    Property.countDocuments(query),
  ]);
  const propertyIds = records.map((property) => property._id);
  const rooms = propertyIds.length
    ? await Room.find({ property: { $in: propertyIds } })
        .select('property pricePerNight type')
        .lean()
    : [];
  const minPriceByProperty = new Map<string, { price: number; isPerPerson: boolean }>();

  for (const room of rooms) {
    const propertyId = room.property.toString();
    const current = minPriceByProperty.get(propertyId);
    if (!current || room.pricePerNight < current.price) {
      minPriceByProperty.set(propertyId, {
        price: room.pricePerNight,
        isPerPerson: isDormitoryRoom(room.type),
      });
    }
  }
  const initialProperties = records.map((property) => {
    const price = minPriceByProperty.get(property._id.toString());
    return {
      _id: property._id.toString(),
      name: property.name,
      area: property.area,
      propertyType: property.propertyType,
      images: property.images,
      amenities: property.amenities,
      minPrice: price?.price,
      minPriceIsPerPerson: price?.isPerPerson,
    };
  });

  return (
    <div className="flex flex-col min-h-svh bg-white">
      <main className="flex-1">
        <PropertyListing initialProperties={initialProperties} initialTotal={total} />
      </main>
      <Footer />
    </div>
  );
}
