import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { SessionUser, Role } from "@/types";

const getDiscordClientId = () =>
  (process.env.DISCORD_CLIENT_ID || "1422296301768540240").trim().replace(/^["']|["']$/g, "");

const getDiscordClientSecret = () =>
  (process.env.DISCORD_CLIENT_SECRET || "e_H7F75Zti_ErbQfMi8WMzFSAiTCxySbM5e").trim().replace(/^["']|["']$/g, "");

const getDiscordRedirectUri = () =>
  (process.env.DISCORD_REDIRECT_URI || "https://apply.vortextiers.xyz").trim().replace(/^["']|["']$/g, "");

const OAUTH_STATE_COOKIE_NAME = "vortex_oauth_state";

export interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
  verified?: boolean;
}

/**
 * Generate Discord OAuth2 URL with CSRF state token stored in HttpOnly cookie
 */
export function getDiscordAuthUrl(): string {
  const clientId = getDiscordClientId();
  const redirectUri = getDiscordRedirectUri();
  const state = crypto.randomBytes(24).toString("hex");

  const cookieStore = cookies();
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "identify email",
    state,
    prompt: "consent",
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Validate OAuth state and exchange code for Discord user profile
 */
export async function handleDiscordCallback(
  code: string,
  state?: string | null
): Promise<SessionUser> {
  const clientId = getDiscordClientId();
  const clientSecret = getDiscordClientSecret();
  const redirectUriConfig = getDiscordRedirectUri();

  const cookieStore = cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (storedState && state && storedState !== state) {
    throw new Error("Invalid OAuth CSRF state parameter. Please try logging in again.");
  }

  if (storedState) {
    cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
  }

  // 1. Exchange authorization code for Discord access token
  const redirectCandidates = [
    redirectUriConfig,
    "https://apply.vortextiers.xyz",
    "https://apply.vortextiers.xyz/api/auth/callback",
    "https://apply-vortextiers.vercel.app/api/auth/callback",
    "https://apply-vortextiers.vercel.app",
    "http://localhost:3000/api/auth/callback",
    "http://localhost:3000",
  ];

  const uniqueCandidates = Array.from(new Set(redirectCandidates));
  let tokenData: any = null;
  let lastError = "";

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  for (const uri of uniqueCandidates) {
    // Attempt 1: Using Basic Auth Header
    try {
      const res = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: uri,
        }),
      });

      if (res.ok) {
        tokenData = await res.json();
        break;
      } else {
        lastError = await res.text();
      }
    } catch (e: any) {
      lastError = e.message;
    }

    // Attempt 2: Using Form Body Parameters
    try {
      const res = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: uri,
        }),
      });

      if (res.ok) {
        tokenData = await res.json();
        break;
      } else {
        lastError = await res.text();
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  if (!tokenData || !tokenData.access_token) {
    console.error("Discord token exchange failed:", lastError);
    throw new Error(`Discord token exchange returned: ${lastError}`);
  }

  const accessToken = tokenData.access_token;

  // 2. Fetch Discord user profile
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    const errProfile = await userResponse.text();
    throw new Error(`Failed to fetch Discord user profile: ${errProfile}`);
  }

  const discordUser: DiscordUserResponse = await userResponse.json();
  const userEmail = discordUser.email || `${discordUser.id}@vortextiers.discord`;

  // 3. Determine Role & Admin Bootstrap
  const adminDiscordIds = (process.env.ADMIN_DISCORD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const isBootstrapAdmin = adminDiscordIds.includes(discordUser.id);

  // 4. Upsert user in Database
  let existingUser = null;
  try {
    existingUser = await prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });
  } catch (dbErr) {
    console.warn("DB user find error, continuing with session user:", dbErr);
  }

  let userRole: Role = Role.APPLICANT;
  if (existingUser) {
    userRole = existingUser.role;
    if (isBootstrapAdmin && userRole !== Role.ADMIN) {
      userRole = Role.ADMIN;
      try {
        await prisma.user.update({
          where: { discordId: discordUser.id },
          data: { role: Role.ADMIN },
        });
      } catch {}
    }
  } else if (isBootstrapAdmin) {
    userRole = Role.ADMIN;
  }

  let savedUser = null;
  try {
    savedUser = await prisma.user.upsert({
      where: { discordId: discordUser.id },
      update: {
        discordUsername: discordUser.username,
        discordGlobalName: discordUser.global_name || null,
        discordAvatar: discordUser.avatar || null,
        email: userEmail,
        role: userRole,
        lastLoginAt: new Date(),
      },
      create: {
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordGlobalName: discordUser.global_name || null,
        discordAvatar: discordUser.avatar || null,
        email: userEmail,
        role: userRole,
      },
    });
  } catch (err) {
    console.error("Prisma user upsert warning:", err);
  }

  return {
    id: savedUser?.id || discordUser.id,
    discordId: discordUser.id,
    discordUsername: discordUser.username,
    discordGlobalName: discordUser.global_name || null,
    discordAvatar: discordUser.avatar || null,
    email: userEmail,
    role: userRole,
  };
}
