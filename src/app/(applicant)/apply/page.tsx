import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";

export const dynamic = "force-dynamic";

interface ApplyEntryPageProps {
  searchParams?: {
    new?: string;
    pos?: string;
    mode?: string;
  };
}

export default async function ApplyEntryPage({ searchParams }: ApplyEntryPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/api/auth/login?redirect_to=/apply");
  }

  // 1. Check if applications are globally open
  const settings = await dbService.getSettings();
  if (settings.applications_open === false && user.role === "APPLICANT") {
    redirect("/closed");
  }

  const isExplicitNew = searchParams?.new === "1" || searchParams?.new === "true";
  const userApps = await dbService.getUserApplications(user.id);

  // 2. If user didn't explicitly request a new application, resume active draft if present
  if (!isExplicitNew) {
    const activeDraft = userApps.find((a) => a.status === "DRAFT" || a.status === "NEEDS_CHANGES");
    if (activeDraft) {
      redirect(`/apply/${activeDraft.id}`);
    }
  }

  // 3. Create new application draft
  const positions = await dbService.getStaffPositions();
  const defaultPosition = searchParams?.pos || positions[0]?.id || "pos-tester";

  const newDraft = await dbService.createDraft({
    userId: user.id,
    discordId: user.discordId,
    email: user.email,
    positionId: defaultPosition,
    modeId: searchParams?.mode || undefined,
  });

  redirect(`/apply/${newDraft.id}`);
}
