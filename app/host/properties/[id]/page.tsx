import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import mongoose from 'mongoose';
import Footer from '@/components/layout/Footer';
import PropertyManager from '@/components/host/PropertyManager';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Property from '@/models/Property';
import Room from '@/models/Room';

export default async function HostPropertyManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'host') {
    redirect(session.user.role === 'admin' ? '/admin/dashboard' : '/guest/dashboard');
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();
  await dbConnect();
  const property = await Property.findOne({ _id: id, host: session.user.id })
    .select('name description propertyType area address status coordinates images')
    .lean();
  if (!property) notFound();

  const rooms = await Room.find({ property: property._id })
    .select('type pricePerNight maxGuests totalRooms availability blockedDates images')
    .sort({ createdAt: 1 })
    .lean();

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Manage {property.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Update listing details, room types, rates, room counts, and booking availability.
              Changes to this listing go live immediately.
            </p>
          </div>
          <PropertyManager
            property={{
              id: property._id.toString(),
              name: property.name,
              description: property.description,
              propertyType: property.propertyType,
              area: property.area,
              address: property.address,
              lat: property.coordinates?.lat?.toString() || '',
              lng: property.coordinates?.lng?.toString() || '',
              status: property.status,
              images: property.images || [],
            }}
            rooms={rooms.map((room) => ({
              id: room._id.toString(),
              type: room.type,
              pricePerNight: room.pricePerNight,
              maxGuests: room.maxGuests,
              totalRooms: room.totalRooms,
              availability: room.availability,
              images: room.images || [],
              blockedDates: room.blockedDates.map((blocked) => ({
                startDate: blocked.startDate.toISOString().slice(0, 10),
                endDate: blocked.endDate.toISOString().slice(0, 10),
                reason: blocked.reason || '',
              })),
            }))}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
