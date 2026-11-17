'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';

interface BannerProperty {
  id: string;
  name: string;
  area: string;
  minPrice?: number;
}

interface BannerSettings {
  propertyId: string;
  eyebrow: string;
  badge: string;
  titleOverride: string;
  areaOverride: string;
  priceOverride: number | null;
  ratingOverride: number | null;
}

export default function HomepageBannerForm({
  properties,
  initialSettings,
}: {
  properties: BannerProperty[];
  initialSettings: BannerSettings | null;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<BannerSettings>(
    initialSettings || {
      propertyId: properties[0]?.id || '',
      eyebrow: 'This week',
      badge: 'Best value',
      titleOverride: '',
      areaOverride: '',
      priceOverride: null,
      ratingOverride: null,
    }
  );
  const [priceInput, setPriceInput] = useState(
    initialSettings?.priceOverride?.toString() || ''
  );
  const [ratingInput, setRatingInput] = useState(
    initialSettings?.ratingOverride?.toString() || ''
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof BannerSettings>(field: K, value: BannerSettings[K]) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/homepage-banner', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          priceOverride: priceInput === '' ? null : Number(priceInput),
          ratingOverride: ratingInput === '' ? null : Number(ratingInput),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to save homepage banner');
      }
      setMessage('Homepage banner saved.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save homepage banner');
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

  return (
    <form onSubmit={save} className="space-y-5">
      {properties.length === 0 ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Approve a property before you can feature it in the homepage banner.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="banner-property" className="block text-sm font-medium text-slate-700">
              Featured property
            </label>
            <select
              id="banner-property"
              required
              value={settings.propertyId}
              onChange={(event) => update('propertyId', event.target.value)}
              className={fieldClass}
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name} · {property.area}
                  {property.minPrice !== undefined
                    ? ` · from ₹${property.minPrice.toLocaleString('en-IN')}/night`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="banner-eyebrow" className="block text-sm font-medium text-slate-700">
                Top label
              </label>
              <input
                id="banner-eyebrow"
                required
                maxLength={40}
                value={settings.eyebrow}
                onChange={(event) => update('eyebrow', event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="banner-badge" className="block text-sm font-medium text-slate-700">
                Badge
              </label>
              <input
                id="banner-badge"
                required
                maxLength={40}
                value={settings.badge}
                onChange={(event) => update('badge', event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="banner-title" className="block text-sm font-medium text-slate-700">
                Title override <span className="font-normal text-slate-500">(blank uses property name)</span>
              </label>
              <input
                id="banner-title"
                maxLength={80}
                value={settings.titleOverride}
                onChange={(event) => update('titleOverride', event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="banner-area" className="block text-sm font-medium text-slate-700">
                Location override <span className="font-normal text-slate-500">(blank uses property area)</span>
              </label>
              <input
                id="banner-area"
                maxLength={80}
                value={settings.areaOverride}
                onChange={(event) => update('areaOverride', event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="banner-price" className="block text-sm font-medium text-slate-700">
                Price override <span className="font-normal text-slate-500">(blank uses lowest available room)</span>
              </label>
              <input
                id="banner-price"
                type="number"
                min={0}
                step="any"
                value={priceInput}
                onChange={(event) => setPriceInput(event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="banner-rating" className="block text-sm font-medium text-slate-700">
                Rating override <span className="font-normal text-slate-500">(blank uses guest reviews)</span>
              </label>
              <input
                id="banner-rating"
                type="number"
                min={1}
                max={5}
                step="0.1"
                value={ratingInput}
                onChange={(event) => setRatingInput(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        </>
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
      <button
        type="submit"
        disabled={busy || properties.length === 0}
        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save homepage banner'}
      </button>
    </form>
  );
}
