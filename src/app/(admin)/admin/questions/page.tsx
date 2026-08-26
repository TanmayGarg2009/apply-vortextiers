import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { QuestionBuilder } from "@/components/admin/QuestionBuilder";

export default async function AdminQuestionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/api/auth/login");
  if (user.role !== "ADMIN") redirect("/admin");

  const questions = await dbService.getQuestions();
  const positions = await dbService.getStaffPositions();
  const gameModes = await dbService.getGameModes();

  return (
    <QuestionBuilder
      initialQuestions={questions}
      positions={positions}
      gameModes={gameModes}
    />
  );
}
