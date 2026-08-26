import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { ApplicationReviewSuite } from "@/components/admin/ApplicationReviewSuite";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/api/auth/login");
  }

  if (user.role !== "REVIEWER" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const application = await dbService.getApplicationById(params.id);
  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <Link href="/admin/applications">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Application Table
          </Link>
        </Button>
      </div>

      <ApplicationReviewSuite application={application} currentUser={user} />
    </div>
  );
}
