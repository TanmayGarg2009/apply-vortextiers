import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = crypto.randomBytes(24).toString("hex");
    const clientId = (process.env.DISCORD_CLIENT_ID || "1422296301768540240").trim().replace(/^["']|["']$/g, "");
    const redirectUri = (process.env.DISCORD_REDIRECT_URI || "https://apply.vortextiers.xyz").trim().replace(/^["']|["']$/g, "");

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "identify email",
      state,
      prompt: "consent",
    });

    const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
    const res = NextResponse.redirect(authUrl);
    res.cookies.set("vortex_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    });
    return res;
  } catch (error: any) {
    console.error("Login redirect error:", error);
    return NextResponse.json({ error: "Failed to initiate Discord login." }, { status: 500 });
  }
}
