import { createHash } from 'node:crypto';
import SupportChatRateLimit from '@/models/SupportChatRateLimit';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000;
}

export function getSupportChatClientKey(headers: Headers) {
  const forwardedFor = headers.get('x-vercel-forwarded-for') ||
    headers.get('x-forwarded-for') ||
    headers.get('x-real-ip') ||
    'unknown';
  const clientIp = forwardedFor.split(',')[0].trim();
  return createHash('sha256').update(clientIp).digest('hex');
}

export async function consumeSupportChatRequest(clientKey: string) {
  await SupportChatRateLimit.init();

  const now = Date.now();
  const windowStart = new Date(Math.floor(now / WINDOW_MS) * WINDOW_MS);
  const expiresAt = new Date(windowStart.getTime() + WINDOW_MS * 2);
  const filter = { clientKey, windowStart };

  let bucket;
  try {
    bucket = await SupportChatRateLimit.findOneAndUpdate(
      filter,
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true }
    ).lean();
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    bucket = await SupportChatRateLimit.findOneAndUpdate(
      filter,
      { $inc: { count: 1 } },
      { new: true }
    ).lean();
    if (!bucket) throw error;
  }

  return bucket.count <= MAX_REQUESTS_PER_WINDOW;
}
