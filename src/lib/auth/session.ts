import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SessionUser, Role } from "@/types";

export const SESSION_COOKIE_NAME = "vortex_staff_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days session persistence
const SESSION_SECRET = (process.env.SESSION_SECRET || "f8a42b109e8d47b7c25e8931a57c6312480bfde591283c7493217ba0451e9d12").trim();

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export interface SessionPayload {
  user: SessionUser;
  exp: number; // Expiration timestamp in seconds
}

/**
 * Sign payload using HMAC-SHA256
 */
function signPayload(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

/**
 * Create a cryptographically signed session token string
 */
export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload, SESSION_SECRET);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a session token using double-hash constant-time comparison
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    if (!token || typeof token !== "string") return null;
    let cleanToken = token.trim();
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = cleanToken.slice(1, -1);
    }
    const parts = cleanToken.split(".");
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    const expectedSignature = signPayload(encodedPayload, SESSION_SECRET);

    // Constant-time comparison using fixed 32-byte sha256 digests to prevent timing attacks & buffer mismatch exceptions
    const sigHash = crypto.createHash("sha256").update(signature).digest();
    const expHash = crypto.createHash("sha256").update(expectedSignature).digest();
    if (!crypto.timingSafeEqual(sigHash, expHash)) {
      return null;
    }

    const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload: SessionPayload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload.user;
  } catch {
    return null;
  }
}

/**
 * Read and verify session cookie from current request
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Set session cookie on a NextResponse object (MANDATORY for Route Handlers)
 */
export function attachSessionCookie(response: NextResponse, user: SessionUser): NextResponse {
  const token = createSessionToken(user);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

/**
 * Write session cookie to async cookies() store (for Server Actions)
 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = createSessionToken(user);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
}

/**
 * Invalidate and clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
