import { describe, it, expect } from "vitest";
import { checkRateLimit, RateLimitRule } from "@/lib/security/rate-limit";

describe("Rate Limiting Engine", () => {
  it("allows requests under the rate limit", () => {
    const rule: RateLimitRule = { limit: 5, windowSeconds: 10 };
    const id = `test-user-${Date.now()}-1`;

    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(id, rule);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(4 - i);
    }
  });

  it("blocks requests that exceed the limit with accurate reset time", () => {
    const rule: RateLimitRule = { limit: 3, windowSeconds: 10 };
    const id = `test-user-${Date.now()}-2`;

    // Exhaust tokens
    checkRateLimit(id, rule);
    checkRateLimit(id, rule);
    checkRateLimit(id, rule);

    // 4th request must be rejected
    const blocked = checkRateLimit(id, rule);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.reset).toBeGreaterThan(0);
  });
});
