import { NextRequest, NextResponse } from "next/server";
import { handleDiscordCallback } from "@/lib/auth/discord";
import { attachSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

function getCanonicalDestination(targetPath: string, req: NextRequest): string {
  const target = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL.trim();
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    if (baseUrl.startsWith("http://") && !baseUrl.includes("localhost")) {
      baseUrl = baseUrl.replace("http://", "https://");
    }
    return `${baseUrl.replace(/\/$/, "")}${target}`;
  }

  const parsed = new URL(target, req.url);
  if (process.env.NODE_ENV === "production" && !parsed.host.includes("localhost")) {
    parsed.protocol = "https:";
  }
  return parsed.toString();
}

export async function GET(req: NextRequest) {
  const rateLimitError = enforceRateLimit(req, "AUTH_CALLBACK");
  if (rateLimitError) return rateLimitError;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const fromRoot = url.searchParams.get("from_root") === "1";
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    console.error("Discord OAuth returned error:", error, errorDescription);
    const errUrl = getCanonicalDestination(`/?auth_error=${encodeURIComponent(errorDescription || error)}`, req);
    return NextResponse.redirect(errUrl);
  }

  if (!code) {
    const errUrl = getCanonicalDestination("/?auth_error=Missing+OAuth+authorization+code", req);
    return NextResponse.redirect(errUrl);
  }

  // Parse target destination from state
  let targetPath = "/dashboard";
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (parsed.to && typeof parsed.to === "string" && parsed.to.startsWith("/")) {
        targetPath = parsed.to;
      }
    } catch {}
  }

  try {
    const preferredUri = fromRoot
      ? "https://apply.vortextiers.xyz"
      : "https://apply.vortextiers.xyz/api/auth/callback";

    const user = await handleDiscordCallback(code, state, preferredUri);

    await logAudit({
      actorId: user.id,
      action: "USER_LOGIN_DISCORD",
      targetType: "User",
      targetId: user.id,
      metadata: {
        discordId: user.discordId,
        username: user.discordUsername,
        role: user.role,
      },
    });

    const destinationUrl = getCanonicalDestination(targetPath, req);
    const res = NextResponse.redirect(destinationUrl, 303);
    attachSessionCookie(res, user);
    res.cookies.delete("vortex_oauth_state");
    return res;
  } catch (err: any) {
    console.error("OAuth callback processing error:", err);
    const errUrl = getCanonicalDestination(
      `/?auth_error=${encodeURIComponent(err.message || "Authentication failed")}`,
      req
    );
    return NextResponse.redirect(errUrl);
  }
}
