import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { ModesManager } from "@/components/admin/ModesManager";

export default async function AdminModesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/api/auth/login");
  if (user.role !== "ADMIN") redirect("/admin");

  const modes = await dbService.getGameModes();
  return <ModesManager initialModes={modes} />;
}
