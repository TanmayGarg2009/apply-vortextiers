import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";

export async function POST() {
  const user = await getSessionUser();
  if (user) {
    await logAudit({
      actorId: user.id,
      action: "USER_LOGOUT",
      targetType: "User",
      targetId: user.id,
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
