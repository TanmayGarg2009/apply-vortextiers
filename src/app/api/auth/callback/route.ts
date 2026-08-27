import { NextRequest, NextResponse } from "next/server";
import { handleDiscordCallback } from "@/lib/auth/discord";
import { attachSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const fromRoot = url.searchParams.get("from_root") === "1";
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    console.error("Discord OAuth returned error:", error, errorDescription);
    const errUrl = new URL(`/?auth_error=${encodeURIComponent(errorDescription || error)}`, req.url).toString();
    return NextResponse.redirect(errUrl);
  }

  if (!code) {
    const errUrl = new URL("/?auth_error=Missing+OAuth+authorization+code", req.url).toString();
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

    const destinationUrl = new URL(targetPath, req.url).toString();
    const res = NextResponse.redirect(destinationUrl);
    attachSessionCookie(res, user);
    res.cookies.delete("vortex_oauth_state");
    return res;
  } catch (err: any) {
    console.error("OAuth callback processing error:", err);
    const errUrl = new URL(
      `/?auth_error=${encodeURIComponent(err.message || "Authentication failed")}`,
      req.url
    ).toString();
    return NextResponse.redirect(errUrl);
  }
}
