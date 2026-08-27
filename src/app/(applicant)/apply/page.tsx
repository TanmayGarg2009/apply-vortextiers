import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { ApplicationWizard } from "@/components/applicant/ApplicationWizard";

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

  // Fetch all prerequisite data in a single parallel batch
  const [settings, userApps, positions, gameModes, questions] = await Promise.all([
    dbService.getSettings(),
    dbService.getUserApplications(user.id),
    dbService.getStaffPositions(),
    dbService.getGameModes(),
    dbService.getQuestions(),
  ]);

  if (settings.applications_open === false && user.role === "APPLICANT") {
    redirect("/closed");
  }

  const isExplicitNew = searchParams?.new === "1" || searchParams?.new === "true";

  // Check for active draft
  let application = !isExplicitNew
    ? (userApps || []).find((a) => a.status === "DRAFT" || a.status === "NEEDS_CHANGES")
    : null;

  // If no draft exists, create one
  if (!application) {
    const defaultPosition = searchParams?.pos || positions[0]?.id || "pos-tester";
    application = await dbService.createDraft({
      userId: user.id,
      discordId: user.discordId,
      email: user.email,
      positionId: defaultPosition,
      modeId: searchParams?.mode || undefined,
    });
  } else {
    // If resuming existing draft, fetch lightweight details
    const fullDraft = await dbService.getApplicationById(application.id, false);
    if (fullDraft) {
      application = fullDraft;
    }
  }

  return (
    <ApplicationWizard
      user={user}
      initialApplication={application}
      positions={positions}
      gameModes={gameModes}
      questions={questions}
    />
  );
}
