import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/api/auth/login");
  }

  if (user.role !== "REVIEWER" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#0d1117]">
        {children}
      </main>
    </div>
  );
}
