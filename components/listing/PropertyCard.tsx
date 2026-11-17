'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

export interface PropertyCardProps {
  _id: string;
  name: string;
  area: string;
  propertyType?: string;
  images?: string[];
  amenities?: string[];
  minPrice?: number;
  minPriceIsPerPerson?: boolean;
}

export default function PropertyCard({
  _id,
  name,
  area,
  propertyType,
  images,
  amenities,
  minPrice,
  minPriceIsPerPerson,
}: PropertyCardProps) {
  const image = images?.[0];

  return (
    <Link
      href={`/properties/${_id}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 sm:aspect-video">
        {image ? (
          <Image
            src={image}
            alt={`${name} in ${area}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100">
            <span className="text-slate-400 text-sm">No image</span>
          </div>
        )}
        {propertyType && (
          <div className="absolute left-3 top-3 rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold capitalize text-white shadow-sm backdrop-blur">
            {propertyType.replace(/[-_]/g, ' ')}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
          <h3 className="line-clamp-2 min-w-0 text-base font-bold leading-6 text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-lg">
            {name}
          </h3>
        </div>
        <div className="mb-4 flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={15} className="shrink-0" />
          <span className="truncate">{area}</span>
        </div>
        <div className="mb-4 mt-auto">
          {minPrice !== undefined && minPrice !== null ? (
            <span className="text-base font-bold text-slate-900">
              From <span className="text-emerald-700">₹{minPrice.toLocaleString('en-IN')}</span>
              <span className="ml-1 text-sm font-normal text-slate-500">
                {minPriceIsPerPerson ? '/ person / night' : '/ night'}
              </span>
            </span>
          ) : (
            <span className="text-sm text-slate-500">Price on request</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(amenities?.slice(0, 3) || []).map((amenity) => (
            <span
              key={amenity}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
