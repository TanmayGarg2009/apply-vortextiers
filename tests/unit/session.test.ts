import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { SessionUser } from "@/types";

describe("Auth Session Security", () => {
  const mockUser: SessionUser = {
    id: "user_test_123",
    discordId: "123456789012345678",
    discordUsername: "VortexTester",
    discordGlobalName: "Tester Global",
    discordAvatar: "avatar_hash",
    email: "tester@example.com",
    role: "APPLICANT",
  };

  it("should create a valid HMAC-SHA256 signed session token", () => {
    const token = createSessionToken(mockUser);
    expect(token).toBeDefined();
    expect(token).toContain(".");
    
    const parts = token.split(".");
    expect(parts.length).toBe(2);
  });

  it("should verify and decode a legitimate session token", () => {
    const token = createSessionToken(mockUser);
    const decoded = verifySessionToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(mockUser.id);
    expect(decoded?.discordUsername).toBe(mockUser.discordUsername);
    expect(decoded?.role).toBe("APPLICANT");
  });

  it("should reject a tampered session token", () => {
    const token = createSessionToken(mockUser);
    const [payload, sig] = token.split(".");
    
    // Tamper with the payload (e.g. elevate role to ADMIN)
    const rawPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    rawPayload.user.role = "ADMIN";
    const tamperedPayload = Buffer.from(JSON.stringify(rawPayload)).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${sig}`;

    const decoded = verifySessionToken(tamperedToken);
    expect(decoded).toBeNull();
  });

  it("should reject corrupted or invalid strings", () => {
    expect(verifySessionToken("invalid_token")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken("part1.part2.part3")).toBeNull();
  });

  it("should transform direct Supabase connection string to IPv4 pooler", async () => {
    const { getCanonicalDatabaseUrl } = await import("@/lib/db/prisma");
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://postgres:PfjjG071T9zFJsE9@db.nobgnouifnyhcsnowjoo.supabase.co:5432/postgres";
    
    const canonical = getCanonicalDatabaseUrl();
    expect(canonical).toContain("aws-0-ap-south-1.pooler.supabase.com:6543");
    expect(canonical).toContain("postgres.nobgnouifnyhcsnowjoo");
    expect(canonical).toContain("pgbouncer=true");

    process.env.DATABASE_URL = original;
  });
});
