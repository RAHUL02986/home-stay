'use client';

import Image from 'next/image';
import { ChangeEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isDormitoryRoom } from '@/lib/roomPricing';

type RoomAvailability = 'available' | 'unavailable';

interface BlockedDate {
  startDate: string;
  endDate: string;
  reason: string;
}

interface ManagedRoom {
  id?: string;
  type: string;
  pricePerNight: number;
  maxGuests: number;
  totalRooms: number;
  availability: RoomAvailability;
  images: string[];
  blockedDates: BlockedDate[];
}

interface PropertyDetails {
  id: string;
  name: string;
  description: string;
  propertyType: string;
  area: string;
  address: string;
  lat: string;
  lng: string;
  status: string;
  images: string[];
}

export default function PropertyManager({
  property: initialProperty,
  rooms: initialRooms,
}: {
  property: PropertyDetails;
  rooms: ManagedRoom[];
}) {
  const router = useRouter();
  const [property, setProperty] = useState(initialProperty);
  const [images, setImages] = useState(initialProperty.images);
  const [rooms, setRooms] = useState(initialRooms);
  const [blockDateDrafts, setBlockDateDrafts] = useState<Record<number, { startDate: string; endDate: string }>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [removingImage, setRemovingImage] = useState<string | null>(null);
  const [uploadingRoomId, setUploadingRoomId] = useState<string | null>(null);
  const [removingRoomImage, setRemovingRoomImage] = useState<{ roomId: string; imageUrl: string } | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const uploadImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (selectedFiles.length === 0) return;

    setUploadingImages(true);
    setMessage(null);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('images', file));
      const response = await fetch(`/api/properties/${property.id}/images`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to upload images');
      }

      setImages((current) => [...current, ...result.data.images as string[]]);
      setMessage({ text: 'Images uploaded and added to your listing.', error: false });
    } catch (cause) {
      setMessage({
        text: cause instanceof Error ? cause.message : 'Unable to upload images.',
        error: true,
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = async (imageUrl: string) => {
    setRemovingImage(imageUrl);
    setMessage(null);
    try {
      const response = await fetch(`/api/properties/${property.id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to remove image');
      }

      setImages((current) => current.filter((image) => image !== imageUrl));
      setMessage({
        text: result.data.storageCleanup === 'failed'
          ? 'Image removed from the listing, but could not be deleted from image storage.'
          : 'Image removed from your listing.',
        error: result.data.storageCleanup === 'failed',
      });
    } catch (cause) {
      setMessage({
        text: cause instanceof Error ? cause.message : 'Unable to remove image.',
        error: true,
      });
    } finally {
      setRemovingImage(null);
    }
  };

  const updateRoom = <K extends keyof ManagedRoom>(index: number, field: K, value: ManagedRoom[K]) => {
    setRooms((current) => current.map((room, roomIndex) =>
      roomIndex === index ? { ...room, [field]: value } : room
    ));
  };

  const uploadRoomImages = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (selectedFiles.length === 0) return;

    const room = rooms[index];
    if (!room.id) {
      setMessage({ text: 'Save the new room type before uploading its photos.', error: true });
      return;
    }
    if (room.images.length + selectedFiles.length > 10) {
      setMessage({ text: 'A room type can have at most 10 photos.', error: true });
      return;
    }

    setUploadingRoomId(room.id);
    setMessage(null);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('images', file));
      const response = await fetch(`/api/properties/${property.id}/rooms/${room.id}/images`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to upload room photos');
      }

      updateRoom(index, 'images', [...room.images, ...result.data.images as string[]]);
      setMessage({ text: `Photos added to ${room.type}.`, error: false });
    } catch (cause) {
      setMessage({
        text: cause instanceof Error ? cause.message : 'Unable to upload room photos.',
        error: true,
      });
    } finally {
      setUploadingRoomId(null);
    }
  };

  const removeRoomImage = async (index: number, imageUrl: string) => {
    const room = rooms[index];
    if (!room.id) return;

    setRemovingRoomImage({ roomId: room.id, imageUrl });
    setMessage(null);
    try {
      const response = await fetch(`/api/properties/${property.id}/rooms/${room.id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to remove room photo');
      }

      updateRoom(index, 'images', room.images.filter((image) => image !== imageUrl));
      setMessage({
        text: result.data.storageCleanup === 'failed'
          ? 'Photo removed from the room, but could not be deleted from image storage.'
          : `Photo removed from ${room.type}.`,
        error: result.data.storageCleanup === 'failed',
      });
    } catch (cause) {
      setMessage({
        text: cause instanceof Error ? cause.message : 'Unable to remove room photo.',
        error: true,
      });
    } finally {
      setRemovingRoomImage(null);
    }
  };

  const addBlockedDate = (index: number) => {
    const draft = blockDateDrafts[index];
    if (!draft?.startDate || !draft.endDate || draft.endDate <= draft.startDate) {
      setMessage({ text: 'Choose a valid block start date and a later end (checkout) date.', error: true });
      return;
    }
    updateRoom(index, 'blockedDates', [
      ...rooms[index].blockedDates,
      { ...draft, reason: 'Blocked by host' },
    ]);
    setBlockDateDrafts((current) => ({ ...current, [index]: { startDate: '', endDate: '' } }));
    setMessage(null);
  };

  const addRoom = () => {
    if (rooms.length >= 20) {
      setMessage({ text: 'A property can have at most 20 room types.', error: true });
      return;
    }
    setRooms((current) => [
      ...current,
      { type: '', pricePerNight: 0, maxGuests: 2, totalRooms: 1, availability: 'available', images: [], blockedDates: [] },
    ]);
  };

  const removeNewRoom = (index: number) => {
    if (rooms[index]?.id) return;
    setRooms((current) => current.filter((_, roomIndex) => roomIndex !== index));
  };

  const save = async () => {
    if (!property.name.trim() || !property.description.trim() || !property.area.trim() || !property.address.trim()) {
      setMessage({ text: 'Complete all property details before saving.', error: true });
      return;
    }
    if ((property.lat && !property.lng) || (!property.lat && property.lng)) {
      setMessage({ text: 'Enter both latitude and longitude to set a map location.', error: true });
      return;
    }
    if (rooms.length === 0 || rooms.some((room) =>
      !room.type.trim() ||
      !Number.isFinite(room.pricePerNight) ||
      room.pricePerNight < 0 ||
      !Number.isInteger(room.maxGuests) ||
      room.maxGuests < 1 ||
      !Number.isInteger(room.totalRooms) ||
      room.totalRooms < 1
    ) || rooms.some((room) =>
      room.blockedDates.some((blocked) => !blocked.startDate || !blocked.endDate || blocked.endDate <= blocked.startDate)
    )) {
      setMessage({ text: 'Each room needs a type, valid nightly price, guest capacity, and room count.', error: true });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: {
            name: property.name,
            description: property.description,
            propertyType: property.propertyType,
            area: property.area,
            address: property.address,
            ...(property.lat && property.lng
              ? { coordinates: { lat: Number(property.lat), lng: Number(property.lng) } }
              : {}),
          },
          rooms,
        }),
      });
      const result = await response.json() as {
        success: boolean;
        error?: string;
        data?: { rooms: Array<{ id: string }> };
      };
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to save listing changes');
      if (!result.data || result.data.rooms.length !== rooms.length) {
        throw new Error('Listing was saved, but room details could not be refreshed. Reload the page before uploading room photos.');
      }
      setRooms((current) => current.map((room, index) => ({
        ...room,
        id: result.data?.rooms[index].id || room.id,
      })));
      setMessage({ text: 'Listing and room changes saved.', error: false });
      router.refresh();
    } catch (cause) {
      setMessage({
        text: cause instanceof Error ? cause.message : 'Unable to save listing changes.',
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
  const labelClass = 'block text-sm font-medium text-slate-700';

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Property details</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
            {property.status}
          </span>
        </div>
        <label className={labelClass}>
          Property name
          <input className={fieldClass} value={property.name} maxLength={120} onChange={(event) =>
            setProperty((current) => ({ ...current, name: event.target.value }))
          } />
        </label>
        <label className={labelClass}>
          Description
          <textarea className={fieldClass} rows={4} maxLength={5000} value={property.description} onChange={(event) =>
            setProperty((current) => ({ ...current, description: event.target.value }))
          } />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Property type
            <select className={fieldClass} value={property.propertyType} onChange={(event) =>
              setProperty((current) => ({ ...current, propertyType: event.target.value }))
            }>
              {['homestay', 'hotel', 'guesthouse', 'resort', 'apartment', 'villa'].map((type) => (
                <option key={type} value={type}>{type.replace(/[-_]/g, ' ')}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Area
            <input className={fieldClass} value={property.area} maxLength={120} onChange={(event) =>
              setProperty((current) => ({ ...current, area: event.target.value }))
            } />
          </label>
        </div>
        <label className={labelClass}>
          Address
          <input className={fieldClass} value={property.address} maxLength={300} onChange={(event) =>
            setProperty((current) => ({ ...current, address: event.target.value }))
          } />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Map latitude
            <input className={fieldClass} type="number" min="-90" max="90" step="any" value={property.lat} onChange={(event) =>
              setProperty((current) => ({ ...current, lat: event.target.value }))
            } />
          </label>
          <label className={labelClass}>
            Map longitude
            <input className={fieldClass} type="number" min="-180" max="180" step="any" value={property.lng} onChange={(event) =>
              setProperty((current) => ({ ...current, lng: event.target.value }))
            } />
          </label>
        </div>
        <p className="-mt-2 text-xs text-slate-500">Coordinates power the guest-facing map. Both values are required for a map marker.</p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Property photos</h2>
          <p className="mt-1 text-sm text-slate-500">Upload up to 10 JPEG, PNG, or WebP images. Each file can be up to 5 MB.</p>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Add photos
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploadingImages || images.length >= 10}
            onChange={uploadImages}
            className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700`}
          />
        </label>
        {uploadingImages && <p role="status" className="text-sm text-slate-600">Uploading photos…</p>}
        {images.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => (
              <li key={`${image}-${index}`} className="relative h-32 overflow-hidden rounded-lg border border-slate-200">
                <Image
                  src={image}
                  alt={`Property photo ${index + 1}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(image)}
                  disabled={removingImage !== null || uploadingImages}
                  aria-label={`Remove property photo ${index + 1}`}
                  className="absolute right-2 top-2 rounded-md bg-slate-900/80 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {removingImage === image ? 'Removing…' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No property photos have been added.</p>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Rooms and availability</h2>
            <p className="mt-1 text-sm text-slate-600">Mark a room type unavailable to stop new booking requests.</p>
          </div>
          <button type="button" onClick={addRoom} className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
            + Add room type
          </button>
        </div>
        {rooms.map((room, index) => (
          <div key={room.id || `new-room-${index}`} className="space-y-4 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-900">{room.id ? `Room type ${index + 1}` : 'New room type'}</h3>
              {!room.id && (
                <button type="button" onClick={() => removeNewRoom(index)} className="text-sm font-medium text-red-700 hover:text-red-800">
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Room name/type
                <input className={fieldClass} value={room.type} maxLength={100} onChange={(event) =>
                  updateRoom(index, 'type', event.target.value)
                } />
              </label>
              <label className={labelClass}>
                {isDormitoryRoom(room.type) ? 'Price per person per night (INR)' : 'Price per night (INR)'}
                <input className={fieldClass} type="number" min="0" step="0.01" value={room.pricePerNight} onChange={(event) =>
                  updateRoom(index, 'pricePerNight', Number(event.target.value))
                } />
              </label>
              <label className={labelClass}>
                Maximum guests per room
                <input className={fieldClass} type="number" min="1" max="30" step="1" value={room.maxGuests} onChange={(event) =>
                  updateRoom(index, 'maxGuests', Number(event.target.value))
                } />
              </label>
              <label className={labelClass}>
                Number of rooms of this type
                <input className={fieldClass} type="number" min="1" step="1" value={room.totalRooms} onChange={(event) =>
                  updateRoom(index, 'totalRooms', Number(event.target.value))
                } />
              </label>
              <label className={labelClass}>
                Booking availability
                <select className={fieldClass} value={room.availability} onChange={(event) =>
                  updateRoom(index, 'availability', event.target.value as RoomAvailability)
                }>
                  <option value="available">Available for new bookings</option>
                  <option value="unavailable">Unavailable for new bookings</option>
                </select>
              </label>
            </div>
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Room photos</h4>
                <p className="mt-1 text-xs text-slate-500">Upload up to 10 JPEG, PNG, or WebP photos for this room type. Each file can be up to 5 MB.</p>
              </div>
              <label className={labelClass}>
                Add room photos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={!room.id || uploadingRoomId !== null || room.images.length >= 10}
                  onChange={(event) => uploadRoomImages(index, event)}
                  className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700`}
                />
              </label>
              {!room.id && (
                <p className="text-xs text-slate-500">Save the new room type first to upload its photos.</p>
              )}
              {uploadingRoomId === room.id && (
                <p role="status" className="text-sm text-slate-600">Uploading room photos…</p>
              )}
              {room.images.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {room.images.map((image, imageIndex) => (
                    <li key={`${image}-${imageIndex}`} className="relative h-32 overflow-hidden rounded-lg border border-slate-200">
                      <Image
                        src={image}
                        alt={`${room.type || `Room type ${index + 1}`} photo ${imageIndex + 1}`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeRoomImage(index, image)}
                        disabled={removingRoomImage !== null || uploadingRoomId !== null}
                        aria-label={`Remove ${room.type || `room type ${index + 1}`} photo ${imageIndex + 1}`}
                        className="absolute right-2 top-2 rounded-md bg-slate-900/80 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingRoomImage?.roomId === room.id && removingRoomImage?.imageUrl === image ? 'Removing…' : 'Remove'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No photos have been added for this room type.</p>
              )}
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-800">Blocked date ranges</h4>
              <p className="mt-1 text-xs text-slate-500">The start date is blocked; the end date is checkout and remains available.</p>
              {room.blockedDates.map((blocked, blockedIndex) => (
                <div key={`${blocked.startDate}-${blocked.endDate}-${blockedIndex}`} className="mt-2 flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span>{blocked.startDate} through the night before {blocked.endDate}</span>
                  <button
                    type="button"
                    onClick={() => updateRoom(index, 'blockedDates', room.blockedDates.filter((_, dateIndex) => dateIndex !== blockedIndex))}
                    className="text-xs font-semibold text-red-700 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className={labelClass}>
                  Block from
                  <input
                    className={fieldClass}
                    type="date"
                    value={blockDateDrafts[index]?.startDate || ''}
                    onChange={(event) => setBlockDateDrafts((current) => ({
                      ...current,
                      [index]: { ...current[index], startDate: event.target.value, endDate: current[index]?.endDate || '' },
                    }))}
                  />
                </label>
                <label className={labelClass}>
                  Checkout date (not blocked)
                  <input
                    className={fieldClass}
                    type="date"
                    value={blockDateDrafts[index]?.endDate || ''}
                    onChange={(event) => setBlockDateDrafts((current) => ({
                      ...current,
                      [index]: { ...current[index], startDate: current[index]?.startDate || '', endDate: event.target.value },
                    }))}
                  />
                </label>
                <button type="button" onClick={() => addBlockedDate(index)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Add block
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {message && (
        <p role={message.error ? 'alert' : 'status'} className={`rounded-lg p-4 text-sm ${
          message.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
        }`}>
          {message.text}
        </p>
      )}
      <button type="button" onClick={save} disabled={saving} className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? 'Saving changes…' : 'Save listing changes'}
      </button>
    </div>
  );
}
