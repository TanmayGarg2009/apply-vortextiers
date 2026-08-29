import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { SessionUser, Role } from "@/types";

const getDiscordClientId = () =>
  (process.env.DISCORD_CLIENT_ID || "1422296301768540240").trim().replace(/^["']|["']$/g, "");

const getDiscordClientSecret = () =>
  (process.env.DISCORD_CLIENT_SECRET || "e_H7F75Zti_ErbQfMi8WMzFSAiTCxySbM5e").trim().replace(/^["']|["']$/g, "");

const getDiscordRedirectUri = () =>
  (process.env.DISCORD_REDIRECT_URI || "https://apply.vortextiers.xyz/api/auth/callback").trim().replace(/^["']|["']$/g, "");

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
 * Generate Discord OAuth2 URL with state token
 */
export function getDiscordAuthUrl(state?: string, customRedirectUri?: string): string {
  const clientId = getDiscordClientId();
  const redirectUri = customRedirectUri || getDiscordRedirectUri();
  const stateToken = state || crypto.randomBytes(24).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "identify email",
    state: stateToken,
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Validate OAuth state and exchange code for Discord user profile
 */
export async function handleDiscordCallback(
  code: string,
  state?: string | null,
  preferredRedirectUri?: string
): Promise<SessionUser> {
  const clientId = getDiscordClientId();
  const clientSecret = getDiscordClientSecret();
  const configuredUri = getDiscordRedirectUri();

  // Try preferred redirect URI first, then common production candidates
  const redirectCandidates = Array.from(
    new Set(
      [
        preferredRedirectUri,
        configuredUri,
        "https://apply.vortextiers.xyz/api/auth/callback",
        "https://apply.vortextiers.xyz",
        "https://apply-vortextiers.vercel.app/api/auth/callback",
        "https://apply-vortextiers.vercel.app",
        "http://localhost:3000/api/auth/callback",
        "http://localhost:3000",
      ].filter(Boolean) as string[]
    )
  );

  let tokenData: any = null;
  let lastError = "";

  for (const uri of redirectCandidates) {
    // Attempt 1: Standard URL-encoded Body
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

    // Attempt 2: Basic Auth Header
    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
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
  }

  if (!tokenData || !tokenData.access_token) {
    console.error("Discord token exchange failed:", lastError);
    throw new Error(`Discord token exchange returned: ${lastError}`);
  }

  const accessToken = tokenData.access_token;

  // Fetch Discord user profile
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    const errProfile = await userResponse.text();
    throw new Error(`Failed to fetch Discord profile: ${errProfile}`);
  }

  const discordUser: DiscordUserResponse = await userResponse.json();
  const userEmail = discordUser.email || `${discordUser.id}@vortextiers.discord`;

  // Bootstrap Admin determination
  const adminDiscordIds = (process.env.ADMIN_DISCORD_IDS || "1422296301768540240")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const isBootstrapAdmin = adminDiscordIds.includes(discordUser.id);

  let userRole: Role = isBootstrapAdmin ? Role.ADMIN : Role.APPLICANT;
  let existingUser = null;
  try {
    existingUser = await prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });
    if (existingUser) {
      userRole = isBootstrapAdmin ? Role.ADMIN : existingUser.role;
    }
  } catch (dbErr) {
    console.warn("DB user find note:", dbErr);
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
    console.error("Prisma user upsert note:", err);
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

/**
 * Look up real Discord user profile by Snowflake ID using Discord REST API or existing records
 */
export async function fetchDiscordUser(discordId: string): Promise<{
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
} | null> {
  const cleanId = discordId.trim();
  const botToken = process.env.DISCORD_BOT_TOKEN;

  // 1. Try Discord REST API if Bot Token is configured
  if (botToken) {
    try {
      const res = await fetch(`https://discord.com/api/v10/users/${cleanId}`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          username: data.username,
          globalName: data.global_name || null,
          avatar: data.avatar || null,
        };
      }
    } catch (e) {
      console.warn("Discord Bot API lookup note:", e);
    }
  }

  // 2. Check database for existing profile
  try {
    const existing = await prisma.user.findUnique({
      where: { discordId: cleanId },
      select: { discordId: true, discordUsername: true, discordGlobalName: true, discordAvatar: true },
    });
    if (existing) {
      return {
        id: existing.discordId,
        username: existing.discordUsername,
        globalName: existing.discordGlobalName,
        avatar: existing.discordAvatar,
      };
    }
  } catch {}

  return null;
}
