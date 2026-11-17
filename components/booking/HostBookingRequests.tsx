import BookingActionButton from './BookingActionButton';

export interface HostBooking {
  id: string;
  propertyName: string;
  roomType: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  status: string;
  total: number;
}

export default function HostBookingRequests({ bookings }: { bookings: HostBooking[] }) {
  if (bookings.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">You don’t have any booking requests yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200">
      {bookings.map((booking) => (
        <li key={booking.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">{booking.propertyName}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {booking.roomType} · {booking.checkIn} – {booking.checkOut} · {booking.guests} guest(s), {booking.rooms} room(s)
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Guest: {booking.guestName}{booking.guestEmail ? ` · ${booking.guestEmail}` : ''}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">₹{booking.total.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              booking.status === 'confirmed'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-800'
            }`}>
              {booking.status}
            </span>
            {booking.status === 'pending' && (
              <>
                <BookingActionButton bookingId={booking.id} action="confirm" label="Confirm" tone="primary" />
                <BookingActionButton bookingId={booking.id} action="reject" label="Decline" tone="danger" />
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
