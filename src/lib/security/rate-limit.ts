import { NextRequest, NextResponse } from "next/server";

export interface RateLimitRule {
  limit: number;      // Maximum allowed requests in window
  windowSeconds: number; // Time window in seconds
}

export const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  AUTH_LOGIN: { limit: 12, windowSeconds: 60 },
  AUTH_CALLBACK: { limit: 15, windowSeconds: 60 },
  APPLICATION_SUBMIT: { limit: 10, windowSeconds: 60 },
  APPLICATION_AUTOSAVE: { limit: 60, windowSeconds: 60 },
  UPLOAD_CHUNK: { limit: 120, windowSeconds: 60 },
  ADMIN_ACTION: { limit: 60, windowSeconds: 60 },
  PUBLIC_API: { limit: 120, windowSeconds: 60 },
};

interface RateLimitRecord {
  timestamps: number[];
}

const memoryLimiter = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of Array.from(memoryLimiter.entries())) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < 300000);
    if (validTimestamps.length === 0) {
      memoryLimiter.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}, 300000);

export function getClientIp(req: NextRequest): string {
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0];
    if (first) return first.trim();
  }

  return "127.0.0.1";
}

/**
 * Check if an identifier is rate limited under a specific rule
 */
export function checkRateLimit(
  identifier: string,
  rule: RateLimitRule
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const key = `${identifier}`;

  let record = memoryLimiter.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryLimiter.set(key, record);
  }

  // Filter out timestamps outside current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= rule.limit) {
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTimeSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      success: false,
      limit: rule.limit,
      remaining: 0,
      reset: Math.max(1, resetTimeSeconds),
    };
  }

  // Register current hit
  record.timestamps.push(now);

  return {
    success: true,
    limit: rule.limit,
    remaining: rule.limit - record.timestamps.length,
    reset: rule.windowSeconds,
  };
}

/**
 * Enforce rate limit and return 429 response if limit is exceeded
 */
export function enforceRateLimit(
  req: NextRequest,
  ruleName: keyof typeof RATE_LIMIT_RULES,
  customIdentifier?: string
): NextResponse | null {
  const rule = RATE_LIMIT_RULES[ruleName] || RATE_LIMIT_RULES.PUBLIC_API;
  const clientIp = getClientIp(req);
  const identifier = `${ruleName}:${customIdentifier || clientIp}`;

  const result = checkRateLimit(identifier, rule);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please slow down and try again shortly.",
        retryAfter: result.reset,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.reset),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    );
  }

  return null;
}
