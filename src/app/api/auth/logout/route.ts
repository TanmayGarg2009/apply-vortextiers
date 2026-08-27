import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";
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
  const res = NextResponse.redirect(`${baseUrl}/logout`);
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
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
  const res = NextResponse.json({ success: true, redirect: "/logout" });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
