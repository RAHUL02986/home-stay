'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BookingActionButtonProps {
  bookingId: string;
  action: 'confirm' | 'reject' | 'cancel';
  label: string;
  tone?: 'primary' | 'danger' | 'neutral';
}

export default function BookingActionButton({
  bookingId,
  action,
  label,
  tone = 'neutral',
}: BookingActionButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to update booking');
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update booking');
      setBusy(false);
    }
  };

  const classes = tone === 'primary'
    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
    : tone === 'danger'
      ? 'border border-red-200 text-red-700 hover:bg-red-50'
      : 'border border-slate-300 text-slate-700 hover:bg-slate-50';

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${classes}`}
      >
        {busy ? 'Please wait…' : label}
      </button>
      {error && <span role="alert" className="mt-1 max-w-48 text-xs text-red-700">{error}</span>}
    </span>
  );
}
