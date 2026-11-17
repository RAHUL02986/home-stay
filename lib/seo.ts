const deploymentHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const configuredSiteUrl =
  process.env.SITE_URL ||
  (deploymentHost
    ? deploymentHost.startsWith('http')
      ? deploymentHost
      : `https://${deploymentHost}`
    : undefined);

if (!configuredSiteUrl && process.env.NODE_ENV === 'production') {
  throw new Error('Set SITE_URL to the canonical public site origin before deploying.');
}

export const siteUrl = new URL(configuredSiteUrl || 'http://localhost:3000');

if (siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
  throw new Error('SITE_URL must be an origin without a path, query, or fragment.');
}

if (process.env.NODE_ENV === 'production' && siteUrl.protocol !== 'https:') {
  throw new Error('SITE_URL must use HTTPS in production.');
}

export const siteName = 'Find Your Homestay';

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
