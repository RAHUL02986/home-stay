// components/host/PropertyForm.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { isDormitoryRoom } from '@/lib/roomPricing';

interface RoomInput {
  type: string;
  pricePerNight: number;
  maxGuests: number;
  availability: 'available' | 'unavailable';
  features: string[];
}

interface PropertyInput {
  name: string;
  description: string;
  area: string;
  address: string;
  lat: string;
  lng: string;
  amenities: string[];
  images: string[];
}

const AREAS = ['McLeodganj', 'Dharamkot', 'Naddi', 'Bhagsu', 'Dharamshala Town', 'Other'];
const AMENITY_OPTIONS = ['Wi-Fi', 'Mountain View', 'Kitchen', 'Parking', 'Pet-friendly', 'Hot Water', 'Heater'];
const ROOM_FEATURES = ['AC', 'Balcony', 'Attached Bath', 'Heater', 'TV'];

export default function PropertyForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  const [property, setProperty] = useState<PropertyInput>({
    name: '',
    description: '',
    area: AREAS[0],
    address: '',
    lat: '',
    lng: '',
    amenities: [],
    images: [],
  });

  const [rooms, setRooms] = useState<RoomInput[]>([
    { type: '', pricePerNight: 0, maxGuests: 2, availability: 'available', features: [] },
  ]);

  const toggleAmenity = (a: string) =>
    setProperty((p) => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a],
    }));

  const addImage = () => {
    try {
      const url = new URL(imageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Use an HTTP or HTTPS image URL.');
      }
      setProperty((current) => ({
        ...current,
        images: current.images.includes(url.toString())
          ? current.images
          : [...current.images, url.toString()],
      }));
      setImageUrl('');
      setMessage(null);
    } catch {
      setMessage('Enter a valid HTTP or HTTPS image URL.');
    }
  };

  const removeImage = (imageUrl: string) => {
    setProperty((p) => ({
      ...p,
      images: p.images.filter((image) => image !== imageUrl),
    }));
  };

  const toggleRoomFeature = (idx: number, f: string) =>
    setRooms((rs) =>
      rs.map((r, i) =>
        i === idx
          ? { ...r, features: r.features.includes(f) ? r.features.filter((x) => x !== f) : [...r.features, f] }
          : r
      )
    );

  const addRoom = () =>
    setRooms((rs) => [...rs, { type: '', pricePerNight: 0, maxGuests: 2, availability: 'available', features: [] }]);

  const removeRoom = (idx: number) =>
    setRooms((rs) => rs.filter((_, i) => i !== idx));

  const updateRoom = <K extends keyof RoomInput>(
    idx: number,
    field: K,
    value: RoomInput[K]
  ) => setRooms((rs) => rs.map((room, i) => (i === idx ? { ...room, [field]: value } : room)));

  const handleSubmit = async () => {
    if (
      !property.name.trim() ||
      !property.description.trim() ||
      !property.area.trim() ||
      !property.address.trim()
    ) {
      setStep(1);
      setMessage('Enter the property name, description, area, and address.');
      return;
    }
    if (
      rooms.length === 0 ||
      rooms.some(
        (room) =>
          !room.type.trim() ||
          !Number.isFinite(room.pricePerNight) ||
          room.pricePerNight < 0 ||
          !Number.isInteger(room.maxGuests) ||
          room.maxGuests < 1
      )
    ) {
      setStep(3);
      setMessage('Add a valid room type, price, and guest capacity for every room.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: {
            ...property,
            coordinates: property.lat && property.lng ? { lat: Number(property.lat), lng: Number(property.lng) } : undefined,
          },
          rooms,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Submission failed');
      setMessage('Property submitted for admin review.');
      setStep(1);
      router.push('/host/dashboard');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">List Your Property</h2>
      {message && (
        <p
          role="status"
          className={`mb-4 text-sm ${message.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}
        >
          {message}
        </p>
      )}

      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-2 flex-1 rounded-full ${step >= n ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="property-name" className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
            <input id="property-name" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" value={property.name} onChange={(e) => setProperty({ ...property, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="property-description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea id="property-description" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" rows={4} value={property.description} onChange={(e) => setProperty({ ...property, description: e.target.value })} />
          </div>
          <div>
            <label htmlFor="property-area" className="block text-sm font-medium text-slate-700 mb-1">Area</label>
            <select id="property-area" required className="w-full border border-slate-300 rounded-lg px-3 py-2" value={property.area} onChange={(e) => setProperty({ ...property, area: e.target.value })}>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="property-address" className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input id="property-address" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" value={property.address} onChange={(e) => setProperty({ ...property, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" value={property.lat} onChange={(e) => setProperty({ ...property, lat: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" value={property.lng} onChange={(e) => setProperty({ ...property, lng: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => setStep(2)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700">Next</button>
          </div>
        </div>
      )}


      {step === 2 && (
        <div className="space-y-4">
          <p className="font-medium text-slate-700">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-1 rounded-full border text-sm ${property.amenities.includes(a) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300'}`}>{a}</button>
            ))}
          </div>
          <div>
            <label htmlFor="property-image-url" className="block text-sm font-medium text-slate-700 mb-1">Property photo URL</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="property-image-url"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                placeholder="https://example.com/property.jpg"
              />
              <button type="button" onClick={addImage} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Add photo
              </button>
            </div>

            {property.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.images.map((image, index) => (
                  <div key={`${image}-${index}`} className="group relative h-28 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <Image src={image} alt={`Property photo ${index + 1}`} fill unoptimized className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(image)}
                      className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-slate-900"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="text-slate-600 px-5 py-2">Back</button>
            <button type="button" onClick={() => setStep(3)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <p className="font-medium text-slate-700">Rooms</p>
          {rooms.map((room, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-700">Room {idx + 1}</span>
                {rooms.length > 1 && (
                  <button type="button" onClick={() => removeRoom(idx)} className="text-red-500 text-sm font-medium">Remove</button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Room Type</label>
                  <input
                    required
                    placeholder="Deluxe / Double / Family"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={room.type}
                    onChange={(e) => updateRoom(idx, 'type', e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {isDormitoryRoom(room.type) ? 'Price / Person / Night' : 'Price / Night'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="2500"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={room.pricePerNight}
                    onChange={(e) => updateRoom(idx, 'pricePerNight', Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="2"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={room.maxGuests}
                    onChange={(e) => updateRoom(idx, 'maxGuests', Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Availability</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={room.availability}
                    onChange={(e) => {
                      const availability = e.target.value;
                      if (availability === 'available' || availability === 'unavailable') {
                        updateRoom(idx, 'availability', availability);
                      }
                    }}
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Room Features</p>
                <div className="flex flex-wrap gap-2">
                  {ROOM_FEATURES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleRoomFeature(idx, f)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium ${room.features.includes(f) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-300'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addRoom} className="text-emerald-600 text-sm font-medium">+ Add another room</button>

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)} className="text-slate-600 px-5 py-2">Back</button>
            <button type="button" onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Create Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
