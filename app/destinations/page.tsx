import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, MapPin, Mountain } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { destinations } from '@/lib/destinations';

export const metadata: Metadata = {
  title: 'Dharamshala Stay Destinations',
  description:
    'Explore homestays and hotels in McLeodganj, Dharamkot, Naddi, Bhagsu, and Dharamshala Town.',
  alternates: { canonical: '/destinations' },
};

export default function DestinationsPage() {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50 text-slate-900">

      <main className="flex-1">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Destinations</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Discover Dharamshala’s most loved areas
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Browse standout neighbourhoods and choose the perfect mountain-base for your stay.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {destinations.map((area) => (
                <Link
                  key={area.slug}
                  href={`/destinations/${area.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                        <MapPin size={18} />
                      </div>
                      <h2 className="text-2xl font-semibold text-slate-900">{area.name}</h2>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      Explore stays
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-100 via-white to-sky-100 p-5">
                    <div className="flex items-center justify-between text-slate-700">
                      <Mountain size={20} className="text-emerald-700" />
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Popular</span>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-600">{area.description}</p>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                    Explore area
                    <ArrowRight size={16} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
