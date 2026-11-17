'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import PropertyCard from './PropertyCard';
import SearchFilters from './SearchFilters';

interface Property {
  _id: string;
  name: string;
  area: string;
  propertyType?: string;
  images?: string[];
  amenities?: string[];
  minPrice?: number;
  minPriceIsPerPerson?: boolean;
}

interface PropertyListingProps {
  initialFilters?: Record<string, string>;
  initialProperties?: Property[];
  initialTotal?: number;
}

export default function PropertyListing({
  initialFilters = {},
  initialProperties,
  initialTotal = 0,
}: PropertyListingProps) {
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [properties, setProperties] = useState<Property[]>(initialProperties || []);
  const [loading, setLoading] = useState(initialProperties === undefined);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(initialTotal);
  const skipInitialFetch = useRef(initialProperties !== undefined);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.area) params.set('area', filters.area);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.amenity) params.set('amenity', filters.amenity);
      if (filters.availability) params.set('availability', filters.availability);
      params.set('limit', '12');

      const res = await fetch(`/api/properties?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load properties');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load properties');

      setProperties(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchProperties();
  }, [fetchProperties]);

  const handleFilter = (nextFilters: Record<string, string>) => {
    setFilters(nextFilters);
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-10">
      <aside className="self-start lg:sticky lg:top-24">
        <SearchFilters defaultFilters={initialFilters} onFilter={handleFilter} />
      </aside>

      <section className="min-w-0">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {total} Stay{total !== 1 ? 's' : ''} Found
            </h1>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Browse homestays and hotels across Dharamshala.
            </p>
          </div>
          {Object.values(filters).some((v) => v) && (
            <Button variant="outline" size="sm" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="text-red-700 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProperties}
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 text-center">
            <p className="text-base font-semibold text-slate-700">
              No stays found matching your filters.
            </p>
            <p className="mt-1 text-sm text-slate-500">Try changing the area, price, or amenities.</p>
            <Button variant="outline" size="sm" onClick={() => setFilters({})} className="mt-3">
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property._id} {...property} />
            ))}
          </div>
        )}
      </section>
     </div>
  );
}
