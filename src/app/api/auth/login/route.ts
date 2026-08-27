import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDiscordAuthUrl } from "@/lib/auth/discord";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const redirectTo = url.searchParams.get("redirect_to") || "/dashboard";

    const statePayload = {
      rnd: crypto.randomBytes(16).toString("hex"),
      to: redirectTo,
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

    const authUrl = getDiscordAuthUrl(state);
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
