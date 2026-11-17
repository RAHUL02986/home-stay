import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/dbConnect';
import { destinations } from '@/lib/destinations';
import { absoluteUrl } from '@/lib/seo';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();
  const properties = await Property.find({ status: 'approved' })
    .select('_id updatedAt images')
    .sort({ updatedAt: -1 })
    .lean();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), priority: 1 },
    { url: absoluteUrl('/properties'), priority: 0.9 },
    { url: absoluteUrl('/destinations'), priority: 0.8 },
    { url: absoluteUrl('/privacy-policy'), priority: 0.2 },
    { url: absoluteUrl('/terms-of-service'), priority: 0.2 },
    { url: absoluteUrl('/cancellation-policy'), priority: 0.2 },
    ...destinations.map((destination) => ({
      url: absoluteUrl(`/destinations/${destination.slug}`),
      priority: 0.7,
    })),
  ];

  const propertyPages: MetadataRoute.Sitemap = properties.map((property) => ({
    url: absoluteUrl(`/properties/${property._id.toString()}`),
    lastModified: property.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
    images: property.images,
  }));

  return [...staticPages, ...propertyPages];
}
