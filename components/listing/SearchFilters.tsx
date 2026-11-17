'use client';

import { useState } from 'react';
import { Filter, RefreshCw } from 'lucide-react';

const AREAS = ['McLeodganj', 'Dharamkot', 'Naddi', 'Bhagsu', 'Dharamshala Town'];
const AMENITIES = ['Wi-Fi', 'Mountain View', 'Kitchen', 'Parking', 'Pet-friendly', 'Hot Water'];

export interface Filters {
  area: string;
  minPrice: string;
  maxPrice: string;
  amenity: string;
  availability: string;
}

interface SearchFiltersProps {
  defaultFilters?: Partial<Filters>;
  onFilter: (filters: Record<string, string>) => void;
}

export default function SearchFilters({
  defaultFilters = {},
  onFilter,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    area: '',
    minPrice: '',
    maxPrice: '',
    amenity: '',
    availability: '',
    ...defaultFilters,
  });

  const reset = () => {
    setFilters({ area: '', minPrice: '', maxPrice: '', amenity: '', availability: '' });
    onFilter({ area: '', minPrice: '', maxPrice: '', amenity: '', availability: '' });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
          <Filter size={16} className="text-emerald-700" />
          Filters
        </h2>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1 rounded-md text-xs font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Area</label>
          <select
            value={filters.area}
            onChange={(e) => setFilters({ ...filters, area: e.target.value })}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All areas</option>
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Min price (₹)</label>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Max price (₹)</label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Availability</label>
          <select
            value={filters.availability}
            onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Any</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Amenity</label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() =>
                setFilters((f) =>
                  f.amenity === amenity
                    ? { ...f, amenity: '' }
                    : { ...f, amenity }
                )
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 ${
                filters.amenity === amenity
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {amenity}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onFilter(filters as unknown as Record<string, string>)}
        className="mt-5 w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        Apply Filters
      </button>
    </div>
  );
}
