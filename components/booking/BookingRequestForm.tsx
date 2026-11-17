'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isDormitoryRoom } from '@/lib/roomPricing';

interface BookableRoom {
  id: string;
  type: string;
  pricePerNight: number;
  maxGuests: number;
  totalRooms: number;
  availability: 'available' | 'unavailable';
  minStay: number;
  maxStay?: number;
  advanceBookingDays: number;
}

interface BookingRequestFormProps {
  propertyId: string;
  rooms: BookableRoom[];
  user: { name: string; phone: string };
}

function localDateValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export default function BookingRequestForm({ propertyId, rooms, user }: BookingRequestFormProps) {
  const router = useRouter();
  const today = localDateValue(new Date());
  const [roomId, setRoomId] = useState(rooms.find((room) => room.availability === 'available')?.id || '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [roomCount, setRoomCount] = useState(1);
  const [fullName, setFullName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRoom = rooms.find((room) => room.id === roomId);
  const isPerPersonRate = selectedRoom ? isDormitoryRoom(selectedRoom.type) : false;
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.round((new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86_400_000));
  }, [checkIn, checkOut]);
  const estimate = selectedRoom && nights > 0
    ? selectedRoom.pricePerNight * nights * (isPerPersonRate ? guests : roomCount)
    : 0;

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (whatsappOptIn && !/^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s()-]/g, ''))) {
      setError('For WhatsApp updates, enter your phone in international format, for example +14155552671.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: guests,
          numberOfRooms: roomCount,
          fullName,
          phone,
          whatsappOptIn,
          specialRequests,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to send booking request');
      }
      const { guest, host } = result.data.whatsapp as { guest: string; host: string };
      const whatsappNotice = guest === 'sent' && host === 'sent'
        ? 'sent'
        : guest === 'sent' && host === 'not_opted_in'
          ? 'host-opted-out'
        : guest === 'not_opted_in' && host === 'sent'
          ? 'guest-opted-out'
          : guest === 'not_opted_in' && host === 'not_opted_in'
            ? 'no-opt-ins'
          : guest === 'not_configured' || host === 'not_configured'
            ? 'setup'
            : 'failed';
      router.push(`/guest/dashboard?booking=requested&whatsapp=${whatsappNotice}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send booking request');
    } finally {
      setSubmitting(false);
    }
  };

  if (rooms.length === 0 || !rooms.some((room) => room.availability === 'available')) {
    return <p className="text-sm text-slate-500">There are currently no bookable rooms.</p>;
  }

  return (
    <form onSubmit={submitRequest} className="mt-5 space-y-4 border-t border-slate-100 pt-5">
      <div>
        <label htmlFor="booking-room" className="mb-1 block text-xs font-semibold text-slate-600">Room type</label>
        <select
          id="booking-room"
          value={roomId}
          onChange={(event) => {
            setRoomId(event.target.value);
            setRoomCount(1);
          }}
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {rooms.filter((room) => room.availability === 'available').map((room) => (
            <option key={room.id} value={room.id}>
              {room.type} · ₹{room.pricePerNight.toLocaleString('en-IN')}{isDormitoryRoom(room.type) ? '/person/night' : '/night'} · up to {room.maxGuests} guests per room
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="check-in" className="mb-1 block text-xs font-semibold text-slate-600">Check-in</label>
          <input id="check-in" type="date" min={today} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="check-out" className="mb-1 block text-xs font-semibold text-slate-600">Check-out</label>
          <input id="check-out" type="date" min={checkIn || today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="booking-guests" className="mb-1 block text-xs font-semibold text-slate-600">Guests</label>
          <input id="booking-guests" type="number" min={1} max={Math.max(1, (selectedRoom?.maxGuests || 1) * roomCount)} value={guests} onChange={(event) => setGuests(Number(event.target.value))} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="booking-rooms" className="mb-1 block text-xs font-semibold text-slate-600">Rooms</label>
          <input id="booking-rooms" type="number" min={1} max={selectedRoom?.totalRooms || 1} value={roomCount} onChange={(event) => {
            const count = Number(event.target.value);
            setRoomCount(count);
            if (selectedRoom) setGuests((current) => Math.min(current, selectedRoom.maxGuests * count));
          }} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="traveler-name" className="mb-1 block text-xs font-semibold text-slate-600">Traveler name</label>
        <input id="traveler-name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={100} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label htmlFor="traveler-phone" className="mb-1 block text-xs font-semibold text-slate-600">Phone number (required)</label>
        <input id="traveler-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} minLength={5} maxLength={30} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-slate-500">The host can use this number to contact you about your booking.</p>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={whatsappOptIn}
          onChange={(event) => setWhatsappOptIn(event.target.checked)}
          className="mt-0.5 accent-emerald-600"
        />
        <span>
          I agree to receive WhatsApp updates about this booking at the phone number above.
          {whatsappOptIn && <span className="mt-1 block text-xs text-slate-500">Use international format, e.g. +14155552671.</span>}
        </span>
      </label>
      <div>
        <label htmlFor="special-requests" className="mb-1 block text-xs font-semibold text-slate-600">Special requests (optional)</label>
        <textarea id="special-requests" value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} maxLength={1000} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      {nights > 0 && selectedRoom && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>
              ₹{selectedRoom.pricePerNight.toLocaleString('en-IN')} × {nights} nights ×{' '}
              {isPerPersonRate ? `${guests} guest(s)` : `${roomCount} room(s)`}
            </span>
            <span>₹{estimate.toLocaleString('en-IN')}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">This is a request; the host must confirm availability. Payment is not collected yet.</p>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !selectedRoom}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Sending request…' : 'Request to book'}
      </button>
    </form>
  );
}
