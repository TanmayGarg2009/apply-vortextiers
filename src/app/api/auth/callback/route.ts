import { NextRequest, NextResponse } from "next/server";
import { handleDiscordCallback } from "@/lib/auth/discord";
import { attachSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
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

  try {
    const user = await handleDiscordCallback(code, state);

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

    const res = NextResponse.redirect(`${baseUrl}/dashboard`);
    attachSessionCookie(res, user);
    return res;
  } catch (err: any) {
    console.error("OAuth callback processing error:", err);
    return NextResponse.redirect(
      `${baseUrl}/?auth_error=${encodeURIComponent(err.message || "Authentication failed")}`
    );
  }
}
