'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ReviewProperty {
  id: string;
  name: string;
  description: string;
  propertyType: string;
  area: string;
  address: string;
  amenities: string[];
  images: string[];
  submittedAt: string;
  hostName: string;
  hostEmail: string;
}

export default function AdminPropertyQueue({
  properties: initialProperties,
}: {
  properties: ReviewProperty[];
}) {
  const [properties, setProperties] = useState(initialProperties);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to review this property');
      }
      setProperties((current) => current.filter((property) => property.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to review this property');
    } finally {
      setBusyId(null);
    }
  };

  if (properties.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">There are no properties waiting for review.</p>;
  }

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {properties.map((property) => (
        <article key={property.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-5 md:flex-row">
            {property.images[0] && (
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 md:w-56">
                <Image
                  src={property.images[0]}
                  alt={property.name}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 224px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{property.name}</h3>
                  <p className="mt-1 text-sm capitalize text-slate-600">
                    {property.propertyType.replace(/[-_]/g, ' ')} · {property.area}
                  </p>
                </div>
                <time className="text-xs text-slate-500">
                  Submitted {new Date(property.submittedAt).toLocaleDateString()}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{property.description}</p>
              <p className="mt-2 text-sm text-slate-600">{property.address}</p>
              <p className="mt-2 text-sm text-slate-600">
                Host: {property.hostName}{property.hostEmail ? ` · ${property.hostEmail}` : ''}
              </p>
              {property.amenities.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">Amenities: {property.amenities.join(', ')}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === property.id}
                  onClick={() => review(property.id, 'approved')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === property.id}
                  onClick={() => review(property.id, 'rejected')}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
