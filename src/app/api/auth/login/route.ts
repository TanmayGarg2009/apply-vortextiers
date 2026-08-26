import { NextResponse } from "next/server";
import { getDiscordAuthUrl } from "@/lib/auth/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUrl = getDiscordAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Login redirect error:", error);
    return NextResponse.json({ error: "Failed to initiate Discord login." }, { status: 500 });
  }
}
