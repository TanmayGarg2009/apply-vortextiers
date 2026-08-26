import crypto from "crypto";
import { cookies } from "next/headers";
import { SessionUser, Role } from "@/types";

const SESSION_COOKIE_NAME = "vortex_staff_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "vortex_staff_session_default_secret_key_32_chars_min";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

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
 * Verify and decode a session token
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    const expectedSignature = signPayload(encodedPayload, SESSION_SECRET);

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
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
 * Set session cookie in Next.js Server Action / Route Handler
 */
export async function setSessionCookie(user: SessionUser) {
  const token = createSessionToken(user);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get current authenticated user from cookies
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value);
}
