import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user) {
      await logAudit({
        actorId: user.id,
        action: "USER_LOGOUT",
        targetType: "User",
        targetId: user.id,
      });
    }
  } catch {}

  await clearSessionCookie();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apply.vortextiers.xyz";
  return NextResponse.redirect(`${baseUrl}/logout`);
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (user) {
      await logAudit({
        actorId: user.id,
        action: "USER_LOGOUT",
        targetType: "User",
        targetId: user.id,
      });
    }
  } catch {}

  await clearSessionCookie();
  return NextResponse.json({ success: true, redirect: "/logout" });
}
