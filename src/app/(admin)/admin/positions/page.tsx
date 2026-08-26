import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { PositionsManager } from "@/components/admin/PositionsManager";

export default async function AdminPositionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/api/auth/login");
  if (user.role !== "ADMIN") redirect("/admin");

  const positions = await dbService.getStaffPositions();
  return <PositionsManager initialPositions={positions} />;
}
