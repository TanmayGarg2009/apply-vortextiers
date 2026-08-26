import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { SessionUser, Role } from "@/types";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1422296301768540240";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const DISCORD_REDIRECT_URI =
  process.env.DISCORD_REDIRECT_URI || "https://apply.vortextiers.xyz/api/auth/callback";
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
    client_id: DISCORD_CLIENT_ID,
    response_type: "code",
    redirect_uri: DISCORD_REDIRECT_URI,
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
  state: string
): Promise<SessionUser> {
  const cookieStore = cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (!storedState || storedState !== state) {
    throw new Error("Invalid OAuth CSRF state parameter. Please try logging in again.");
  }
  // Clear state cookie
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);

  // 1. Exchange authorization code for Discord access token
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    console.error("Discord token exchange failed:", errText);
    throw new Error("Failed to exchange authorization code with Discord.");
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // 2. Fetch Discord user profile
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch Discord user profile.");
  }

  const discordUser: DiscordUserResponse = await userResponse.json();

  if (!discordUser.email) {
    throw new Error("A verified email address is required on your Discord account to apply.");
  }

  // 3. Determine Role & Admin Bootstrap
  const adminDiscordIds = (process.env.ADMIN_DISCORD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const isBootstrapAdmin = adminDiscordIds.includes(discordUser.id);

  // 4. Upsert user in Database
  const existingUser = await prisma.user.findUnique({
    where: { discordId: discordUser.id },
  });

  let userRole: Role = Role.APPLICANT;
  if (existingUser) {
    userRole = existingUser.role;
    // Upgrade to ADMIN if in bootstrap list and currently applicant
    if (isBootstrapAdmin && userRole === Role.APPLICANT) {
      userRole = Role.ADMIN;
    }
  } else if (isBootstrapAdmin) {
    userRole = Role.ADMIN;
  }

  const user = await prisma.user.upsert({
    where: { discordId: discordUser.id },
    update: {
      discordUsername: discordUser.username,
      discordGlobalName: discordUser.global_name || null,
      discordAvatar: discordUser.avatar || null,
      email: discordUser.email,
      role: userRole,
      lastLoginAt: new Date(),
    },
    create: {
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordGlobalName: discordUser.global_name || null,
      discordAvatar: discordUser.avatar || null,
      email: discordUser.email,
      role: userRole,
      lastLoginAt: new Date(),
    },
  });

  return {
    id: user.id,
    discordId: user.discordId,
    discordUsername: user.discordUsername,
    discordGlobalName: user.discordGlobalName,
    discordAvatar: user.discordAvatar,
    email: user.email,
    role: user.role as Role,
  };
}
