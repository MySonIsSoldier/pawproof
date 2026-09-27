export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

// Vercel functions can be replicated, so this is deliberately a first barrier,
// not a claim of globally shared quota. Keep the map bounded on warm instances.
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 4096;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size < MAX_BUCKETS) break;
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (!oldest) break;
    buckets.delete(oldest);
  }
}

export function consumeRateLimit(
  key: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): RateLimitResult {
  if (policy.limit < 1 || policy.windowMs < 1)
    throw new Error("Invalid rate-limit policy");

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    prune(now);
    buckets.set(key, { count: 1, resetAt: now + policy.windowMs });
    return {
      allowed: true,
      remaining: policy.limit - 1,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= policy.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: policy.limit - current.count,
    retryAfterSeconds: 0,
  };
}

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitKey(request: Request, scope: string) {
  return `${scope}:${clientAddress(request)}`;
}

export function checkRateLimit(
  request: Request,
  scope: string,
  policy: RateLimitPolicy,
) {
  return consumeRateLimit(rateLimitKey(request, scope), policy);
}

export const publicRateLimits = {
  placeSearch: { limit: 30, windowMs: 60_000 },
  nearby: { limit: 30, windowMs: 60_000 },
  inquiry: { limit: 10, windowMs: 10 * 60_000 },
  inspect: { limit: 6, windowMs: 60_000 },
  verify: { limit: 6, windowMs: 60_000 },
  recover: { limit: 4, windowMs: 5 * 60_000 },
  contact: { limit: 5, windowMs: 15 * 60_000 },
} satisfies Record<string, RateLimitPolicy>;
