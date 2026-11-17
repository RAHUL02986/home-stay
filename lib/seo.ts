const configuredSiteUrl =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

export const siteUrl = new URL(configuredSiteUrl);

if (siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
  throw new Error('SITE_URL must be an origin without a path, query, or fragment.');
}

export const siteName = 'Find Your Homestay';

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
