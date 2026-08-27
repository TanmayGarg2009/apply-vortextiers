import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function ApplyEntryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/api/auth/login?redirect_to=/apply");
  }

  // 1. Check if applications are globally open
  const settings = await dbService.getSettings();
  if (settings.applications_open === false && user.role === "APPLICANT") {
    redirect("/closed");
  }

  // 2. Check for existing active draft
  const userApps = await dbService.getUserApplications(user.id);
  const activeDraft = userApps.find((a) => a.status === "DRAFT" || a.status === "NEEDS_CHANGES");
  if (activeDraft) {
    redirect(`/apply/${activeDraft.id}`);
  }

  // 3. Check for existing submitted application
  const pendingApp = userApps.find(
    (a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW"
  );
  if (pendingApp) {
    redirect(`/dashboard`);
  }

  // 4. Create new draft with default position
  const positions = await dbService.getStaffPositions();
  const defaultPosition = positions[0]?.id || "pos-tester";

  const newDraft = await dbService.createDraft({
    userId: user.id,
    discordId: user.discordId,
    email: user.email,
    positionId: defaultPosition,
  });

  redirect(`/apply/${newDraft.id}`);
}
