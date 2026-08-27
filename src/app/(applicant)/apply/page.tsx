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

  // Local initial application template (drafts are 100% client-side)
  const defaultPosition = searchParams?.pos || positions[0]?.id || "pos-tester";
  const initialApplication: any = {
    id: "draft",
    userId: user.id,
    discordId: user.discordId,
    email: user.email,
    positionId: defaultPosition,
    modeId: searchParams?.mode || null,
    minecraftUsername: "",
    status: "DRAFT",
    version: 1,
    answers: [],
    uploads: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <ApplicationWizard
      user={user}
      initialApplication={initialApplication}
      positions={positions}
      gameModes={gameModes}
      questions={questions}
    />
  );
}
