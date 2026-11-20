/**
 * Tiny fixed-window rate limiter for the live (paid) generation endpoint.
 *
 * It is per server instance (memory), which is enough to stop casual abuse of
 * a demo deployment. For multi-region production traffic, swap this for a
 * shared store such as Upstash Redis or Vercel KV.
 */
export interface RateLimiter {
  check(key: string, now?: number): { ok: boolean; retryAfterSec: number };
  reset(): void;
}

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, { count: number; start: number }>();
  return {
    check(key, now = Date.now()) {
      const entry = hits.get(key);
      if (!entry || now - entry.start >= windowMs) {
        hits.set(key, { count: 1, start: now });
        if (hits.size > 5000) {
          for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
        }
        return { ok: true, retryAfterSec: 0 };
      }
      if (entry.count >= limit) {
        return { ok: false, retryAfterSec: Math.ceil((entry.start + windowMs - now) / 1000) };
      }
      entry.count += 1;
      return { ok: true, retryAfterSec: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous";
}

/** Shared limiter for live Claude generations (default 10 per IP per hour). */
export const liveLimiter = createRateLimiter(
  Number(process.env.LIVE_RATE_LIMIT_PER_HOUR) || 10,
  60 * 60 * 1000,
);
