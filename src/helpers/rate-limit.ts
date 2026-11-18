import type { Context } from 'hono';
import { getConnInfo } from 'hono/bun';
import { createMiddleware } from 'hono/factory';
import { TooManyRequestsError } from '@/helpers/errors';

export const clientIp = (c: Context, trustProxy = false): string => {
  if (trustProxy) {
    const forwardedFor = c.req.header('x-forwarded-for')?.split(',').at(-1)?.trim();
    if (forwardedFor) {
      return forwardedFor;
    }
  }

  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
  trustProxy?: boolean;
  keyGenerator?: (c: Context) => string;
  now?: () => number;
}

export const rateLimit = ({
  windowMs,
  limit,
  trustProxy = false,
  keyGenerator = (c) => clientIp(c, trustProxy),
  now = Date.now,
}: RateLimitOptions) => {
  const hits = new Map<string, { count: number; resetAt: number }>();
  let nextSweepAt = 0;

  return createMiddleware(async (c, next) => {
    const time = now();

    if (time >= nextSweepAt) {
      for (const [key, entry] of hits) {
        if (entry.resetAt <= time) {
          hits.delete(key);
        }
      }
      nextSweepAt = time + windowMs;
    }

    const key = keyGenerator(c);
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= time) {
      entry = { count: 0, resetAt: time + windowMs };
      hits.set(key, entry);
    }

    entry.count++;
    c.header('RateLimit-Limit', String(limit));
    c.header('RateLimit-Remaining', String(Math.max(0, limit - entry.count)));

    if (entry.count > limit) {
      c.header('Retry-After', String(Math.ceil((entry.resetAt - time) / 1000)));
      throw new TooManyRequestsError();
    }

    await next();
  });
};
