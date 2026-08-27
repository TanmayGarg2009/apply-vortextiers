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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apply.vortextiers.xyz";

  if (error) {
    console.error("Discord OAuth returned error:", error, errorDescription);
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=Missing+OAuth+authorization+code`);
  }

  // Parse target destination from state
  let targetPath = "/dashboard";
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (parsed.to && typeof parsed.to === "string") {
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

    const destinationUrl = `${baseUrl}${targetPath.startsWith("/") ? targetPath : "/" + targetPath}`;
    const res = NextResponse.redirect(destinationUrl);
    attachSessionCookie(res, user);
    return res;
  } catch (err: any) {
    console.error("OAuth callback processing error:", err);
    return NextResponse.redirect(
      `${baseUrl}/?auth_error=${encodeURIComponent(err.message || "Authentication failed")}`
    );
  }
}
