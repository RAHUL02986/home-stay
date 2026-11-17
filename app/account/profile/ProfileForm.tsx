'use client';

import { FormEvent, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ProfileFormProps {
  initialProfile: {
    name: string;
    email: string;
    phone: string;
    whatsappBookingOptIn: boolean;
    isHost: boolean;
  };
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const { update } = useSession();
  const [name, setName] = useState(initialProfile.name);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [whatsappBookingOptIn, setWhatsappBookingOptIn] = useState(initialProfile.whatsappBookingOptIn);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, whatsappBookingOptIn }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setName(result.data.name);
      setPhone(result.data.phone);
      setWhatsappBookingOptIn(result.data.whatsappBookingOptIn);
      await update();
      setMessage('Your profile has been updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={saveProfile} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="profile-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          autoComplete="name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      <div>
        <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email address
        </label>
        <input
          id="profile-email"
          value={initialProfile.email}
          readOnly
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
        />
        <p className="mt-1 text-xs text-slate-500">Email address cannot be changed here.</p>
      </div>
      <div>
        <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
          Phone number
        </label>
        <input
          id="profile-phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+14155552671"
          autoComplete="tel"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        <p className="mt-1 text-xs text-slate-500">
          Hosts should use international format (e.g. +14155552671) to receive booking notifications on WhatsApp.
        </p>
      </div>
      {initialProfile.isHost && (
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={whatsappBookingOptIn}
            onChange={(event) => setWhatsappBookingOptIn(event.target.checked)}
            className="mt-0.5 accent-emerald-600"
          />
          <span>I agree to receive WhatsApp notifications when guests request bookings at my properties.</span>
        </label>
      )}
      {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
