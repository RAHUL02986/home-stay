import type { Metadata } from 'next';
﻿import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BedDouble,
  Calendar,
  Car,
  ChevronRight,
  MapPin,
  Mountain,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Utensils,
  Wifi,
} from 'lucide-react';
import mongoose from 'mongoose';
import Footer from '@/components/layout/Footer';
import dbConnect from '@/lib/dbConnect';
import HomepageBanner from '@/models/HomepageBanner';
import Property from '@/models/Property';
import Room from '@/models/Room';
import Review from '@/models/Review';
import { isDormitoryRoom } from '@/lib/roomPricing';
import { siteName, siteUrl } from '@/lib/seo';
import '@/models/User';
import TestimonialCarousel from '@/components/reviews/TestimonialCarousel';

const AREA_ACCENTS = [
  'from-[#0b2f4d] via-[#0d5d9c] to-[#f59e0b]',
  'from-[#143d5d] via-[#1c6ca5] to-[#f7b24c]',
  'from-[#0f3657] via-[#0d7ca7] to-[#f59e0b]',
  'from-[#173f5f] via-[#0e5c8a] to-[#f97316]',
];

const AMENITY_META = [
  { name: 'Wi-Fi', icon: Wifi },
  { name: 'Mountain View', icon: Mountain },
  { name: 'Kitchen', icon: Utensils },
  { name: 'Parking', icon: Car },
  { name: 'Pet-friendly', icon: PawPrint },
  { name: 'Hot Water', icon: Sparkles },
];

const TRUST_POINTS = [
  {
    title: 'Curated local stays',
    description: 'Handpicked homes and boutique stays across Dharamshala’s most loved neighbourhoods.',
    icon: BedDouble,
  },
  {
    title: 'Transparent pricing',
    description: 'Clear nightly pricing and room details so you can compare places in seconds.',
    icon: ShieldCheck,
  },
  {
    title: 'Perfect for every trip',
    description: 'Ideal for solo travellers, couples, families, and remote workers seeking mountain calm.',
    icon: Users,
  },
];

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Homestays in Dharamshala | Find Your Homestay' },
  description:
    'Find homestays, hotels, and guest houses in Dharamshala, McLeodganj, Dharamkot, Naddi, and Bhagsu. Compare local stays and room details.',
  alternates: { canonical: '/' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: siteUrl.toString(),
  description:
    'Discover homestays, hotels, and guest houses across Dharamshala and its mountain neighbourhoods.',
  publisher: {
    '@type': 'Organization',
    name: siteName,
    url: siteUrl.toString(),
    areaServed: {
      '@type': 'City',
      name: 'Dharamshala',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: 'https://wa.me/917807102986',
    },
  },
};

export default async function Home() {
  await dbConnect();
  const [availablePropertyIds, areaCounts, approvedReviews, bannerSettings] = await Promise.all([
    Room.distinct('property', { availability: 'available' }),
    Property.aggregate<{ _id: string; count: number }>([
      { $match: { status: 'approved' } },
      { $group: { _id: '$area', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 4 },
    ]),
    Review.find({ status: { $in: ['approved', 'pending'] } })
      .populate('guest', 'name')
      .populate('property', 'name area status')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
    HomepageBanner.findOne({ key: 'homepage' }).populate('property', 'name area status').lean(),
  ]);
  const [properties, rooms] = availablePropertyIds.length
    ? await Promise.all([
        Property.find({ _id: { $in: availablePropertyIds }, status: 'approved' })
          .select('name area propertyType images amenities createdAt')
          .sort({ createdAt: -1 })
          .limit(4)
          .lean(),
        Room.find({ property: { $in: availablePropertyIds }, availability: 'available' })
        .select('property pricePerNight images type')
          .lean(),
      ])
    : [[], []];
  const roomDataByProperty = new Map<string, { minPrice: number; minPriceIsPerPerson: boolean; image?: string }>();
  for (const room of rooms) {
    const propertyId = room.property.toString();
    const current = roomDataByProperty.get(propertyId);
    if (!current || room.pricePerNight < current.minPrice) {
      roomDataByProperty.set(propertyId, {
        minPrice: room.pricePerNight,
        minPriceIsPerPerson: isDormitoryRoom(room.type),
        image: room.images?.[0],
      });
    } else if (!current.image && room.images?.[0]) {
      roomDataByProperty.set(propertyId, { ...current, image: room.images[0] });
    }
  }
  const featuredProperties = properties.map((property) => {
    const roomData = roomDataByProperty.get(property._id.toString());
    return {
      id: property._id.toString(),
      name: property.name,
      area: property.area,
      propertyType: property.propertyType,
      amenities: property.amenities || [],
      image: property.images?.[0] || roomData?.image,
      minPrice: roomData?.minPrice,
      minPriceIsPerPerson: roomData?.minPriceIsPerPerson,
    };
  });
  const configuredBannerProperty = bannerSettings?.property as unknown as {
    _id?: unknown;
    name?: string;
    area?: string;
    status?: string;
  } | null;
  const isConfiguredPropertyActive = configuredBannerProperty?.status === 'approved';
  const configuredPropertyId = isConfiguredPropertyActive
    ? String(configuredBannerProperty._id)
    : '';
  const fallbackBannerProperty = featuredProperties[0];
  const bannerProperty = isConfiguredPropertyActive
    ? {
        id: configuredPropertyId,
        name: configuredBannerProperty.name || 'Local stay',
        area: configuredBannerProperty.area || 'Dharamshala',
        minPrice: roomDataByProperty.get(configuredPropertyId)?.minPrice,
        minPriceIsPerPerson: roomDataByProperty.get(configuredPropertyId)?.minPriceIsPerPerson,
      }
    : fallbackBannerProperty;
  const [ratingStats] = bannerProperty
    ? await Review.aggregate<{ averageRating: number }>([
        {
          $match: {
            property: new mongoose.Types.ObjectId(bannerProperty.id),
            status: { $in: ['approved', 'pending'] },
          },
        },
        { $group: { _id: null, averageRating: { $avg: '$rating' } } },
      ])
    : [];
  const banner = bannerProperty
    ? {
        id: bannerProperty.id,
        eyebrow: isConfiguredPropertyActive ? bannerSettings?.eyebrow || 'This week' : 'This week',
        badge: isConfiguredPropertyActive ? bannerSettings?.badge || 'Best value' : 'Best value',
        title:
          (isConfiguredPropertyActive ? bannerSettings?.titleOverride : '')?.trim() ||
          bannerProperty.name,
        area:
          (isConfiguredPropertyActive ? bannerSettings?.areaOverride : '')?.trim() ||
          bannerProperty.area,
        price:
          isConfiguredPropertyActive && bannerSettings?.priceOverride !== null
            ? bannerSettings?.priceOverride
            : bannerProperty.minPrice,
        priceIsPerPerson:
          isConfiguredPropertyActive && bannerSettings?.priceOverride != null
            ? false
            : bannerProperty.minPriceIsPerPerson,
        rating:
          (isConfiguredPropertyActive && bannerSettings?.ratingOverride !== null
            ? bannerSettings?.ratingOverride
            : ratingStats
              ? Math.round(ratingStats.averageRating * 10) / 10
              : null) ?? null,
      }
    : null;
  const testimonials = approvedReviews.flatMap((review) => {
    const guest = review.guest as unknown as { name?: string } | null;
    const property = review.property as unknown as { _id?: unknown; name?: string; area?: string; status?: string } | null;
    if (!property || property.status !== 'approved') return [];
    return [{
      id: review._id.toString(),
      guestName: guest?.name || 'Guest',
      propertyName: property.name || 'Local stay',
      area: property.area || 'Dharamshala',
      rating: review.rating,
      comment: review.comment,
    }];
  });

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 text-slate-900">

      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#eff8ff_0%,#fdfcf8_28%,#fff7ed_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.11),transparent_28%)]" />
          <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-[#0b2f4d]/5 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center rounded-full border border-[#0b2f4d]/10 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0b2f4d] shadow-sm">
                  Curated stays in Dharamshala
                </span>
                <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] text-[#0b2f4d] sm:text-5xl lg:text-6xl">
                  Find your perfect stay in the Himalayas
                </h1>
                <p className="mt-4 max-w-lg text-lg leading-8 text-slate-600">
                  Explore charming homestays and boutique hotels across Dharamshala — from McLeodganj to Dharamkot, Naddi to Bhagsu.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/properties"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0b2f4d] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-[#123d63]"
                  >
                    Explore stays
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/host/new-property"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                  >
                    List your property
                  </Link>
                </div>
              </div>

              <div className="relative w-full max-w-md">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#0b2f4d]/10 via-[#f59e0b]/10 to-transparent blur-2xl" />
                <div className="relative rounded-[2rem] border border-[#0b2f4d]/10 bg-white/85 p-5 shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6">
                  <div className="rounded-[1.5rem] bg-gradient-to-br from-[#0b2f4d] via-[#134d7c] to-[#f59e0b] p-5">
                    <div className="flex items-center justify-between text-sm text-white/90">
                      <span className="font-medium">{banner?.eyebrow || 'Find your next stay'}</span>
                      {banner && (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#fff3d6]">
                          {banner.badge}
                        </span>
                      )}
                    </div>
                    {banner ? (
                      <Link
                        href={`/properties/${banner.id}`}
                        className="mt-6 block rounded-[1.25rem] border border-white/20 bg-white/10 p-4 shadow-inner shadow-white/10 backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <div className="flex items-center justify-between text-slate-100">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-200">Featured</p>
                            <h3 className="mt-2 text-xl font-bold text-white">{banner.title}</h3>
                          </div>
                          {banner.rating !== null && (
                            <div className="flex items-center gap-1 rounded-full bg-[#f59e0b] px-2 py-1 text-sm font-bold text-[#0b2f4d]">
                              <Star size={14} className="fill-current" /> {banner.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-100">
                          <MapPin size={16} className="text-[#f9d58d]" /> {banner.area}
                        </div>
                        <div className="mt-5 flex items-center justify-between">
                          <p className="text-2xl font-black text-white">
                            {banner.price !== undefined && banner.price !== null
                              ? `₹${banner.price.toLocaleString('en-IN')}`
                              : 'Contact'}
                          </p>
                          <span className="text-sm text-slate-200">
                            {banner.price !== undefined && banner.price !== null
                              ? banner.priceIsPerPerson ? '/ person / night' : '/ night'
                              : 'for pricing'}
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <Link
                        href="/properties"
                        className="mt-6 block rounded-[1.25rem] border border-white/20 bg-white/10 p-6 text-lg font-semibold text-white hover:bg-white/15"
                      >
                        Explore available stays
                        <ArrowRight className="ml-2 inline" size={18} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
              <form className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="McLeodganj, Dharamkot..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#0b2f4d] focus:bg-white focus:ring-4 focus:ring-[#0b2f4d]/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Check-in</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#0b2f4d] focus:bg-white focus:ring-4 focus:ring-[#0b2f4d]/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Check-out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#0b2f4d] focus:bg-white focus:ring-4 focus:ring-[#0b2f4d]/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Guests</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <select className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#0b2f4d] focus:bg-white focus:ring-4 focus:ring-[#0b2f4d]/10">
                      <option>1 guest</option>
                      <option>2 guests</option>
                      <option>3 guests</option>
                      <option>4+ guests</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f59e0b] px-5 py-3 text-base font-bold text-[#0b2f4d] shadow-lg shadow-orange-200 transition hover:bg-[#f7b24c] focus:outline-none focus:ring-4 focus:ring-[#f59e0b]/20"
                >
                  Search
                  <ChevronRight size={18} />
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0d5d9c]">Popular areas</p>
                <h2 className="mt-2 text-3xl font-black text-[#0b2f4d]">Explore Dharamshala by neighbourhood</h2>
              </div>
              <Link href="/destinations" className="text-sm font-bold text-[#0d5d9c] hover:text-[#0b2f4d]">
                View all areas →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {areaCounts.map((area, index) => (
                <Link key={area._id} href={`/properties?area=${encodeURIComponent(area._id)}`} className="group block">
                  <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-xl">
                    <div className={`h-52 bg-gradient-to-br ${AREA_ACCENTS[index % AREA_ACCENTS.length]}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xl font-bold text-white">{area._id}</span>
                        <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                          {area.count} {area.count === 1 ? 'stay' : 'stays'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-100/80 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0d5d9c]">Why travelers choose us</p>
              <h2 className="mt-2 text-3xl font-black text-[#0b2f4d]">A calm, local stay experience</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {TRUST_POINTS.map(({ title, description, icon: Icon }) => (
                <div key={title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 inline-flex rounded-2xl bg-[#eaf7ff] p-3 text-[#0d5d9c]">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-[#0b2f4d]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0b2f4d] py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f9d58d]">Guest stories</p>
              <h2 className="mt-2 text-3xl font-black text-white">Experiences from real stays</h2>
            </div>
            <TestimonialCarousel reviews={testimonials} />
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0d5d9c]">Featured stays</p>
                <h2 className="mt-2 text-3xl font-black text-[#0b2f4d]">Places to stay in Dharamshala</h2>
              </div>
              <Link href="/properties" className="text-sm font-bold text-[#0d5d9c] hover:text-[#0b2f4d]">
                View all properties →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featuredProperties.map((prop) => (
                <Link key={prop.id} href={`/properties/${prop.id}`} className="group block rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-52 overflow-hidden rounded-[1.1rem] bg-slate-100">
                    {prop.image ? (
                      <Image
                        src={prop.image}
                        alt={`${prop.name} in ${prop.area}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        unoptimized
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-500">
                        Photos coming soon
                      </div>
                    )}
                    {prop.image && <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />}
                    <span className="absolute right-3 top-3 rounded-full bg-[#0b2f4d] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
                      {prop.propertyType}
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {prop.minPrice !== undefined
                        ? `₹${prop.minPrice.toLocaleString('en-IN')}${prop.minPriceIsPerPerson ? '/person/night' : '/night'}`
                        : 'Contact for price'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-[#0b2f4d]">{prop.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <MapPin size={14} className="text-[#0d5d9c]" /> {prop.area}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prop.amenities.map((amenity) => (
                        <span key={amenity} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
              {featuredProperties.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                  <p className="font-semibold text-slate-800">No approved stays are available yet.</p>
                  <p className="mt-1 text-sm text-slate-600">Check back soon as local hosts add their properties.</p>
                  <Link href="/host/new-property" className="mt-4 inline-flex text-sm font-semibold text-[#0d5d9c] hover:text-[#0b2f4d]">
                    List your property
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-[#0b2f4d] py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f9d58d]">Amenities</p>
                <h2 className="mt-3 text-3xl font-black text-white">Everything you need for a comfortable mountain stay</h2>
              </div>
              <Link
                href="/host/new-property"
                className="inline-flex items-center gap-2 rounded-xl bg-[#f59e0b] px-5 py-3 text-sm font-bold text-[#0b2f4d] transition hover:bg-[#f7b24c]"
              >
                List your property
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {AMENITY_META.map(({ name, icon: Icon }) => (
                <div key={name} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f59e0b]/15 text-[#f9d58d]">
                    <Icon size={18} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-100">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
