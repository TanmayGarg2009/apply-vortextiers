import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { SettingsManager } from "@/components/admin/SettingsManager";

export default async function AdminSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/api/auth/login");
  if (user.role !== "ADMIN") redirect("/admin");

  const settings = await dbService.getSettings();
  return <SettingsManager initialSettings={settings} />;
}
