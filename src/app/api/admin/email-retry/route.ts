import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import { retryEmailSend } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { emailEventId } = body;

    if (!emailEventId) {
      return NextResponse.json({ error: "Missing emailEventId." }, { status: 400 });
    }

    const result = await retryEmailSend(emailEventId, admin);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to retry email delivery." }, { status });
  }
}
