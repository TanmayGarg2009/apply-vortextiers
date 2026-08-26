import React from "react";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatus } from "@/types";

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="draft" className={className}>DRAFT</Badge>;
    case "SUBMITTED":
      return <Badge variant="submitted" className={className}>SUBMITTED</Badge>;
    case "UNDER_REVIEW":
      return <Badge variant="under_review" className={className}>UNDER REVIEW</Badge>;
    case "ACCEPTED":
      return <Badge variant="accepted" className={className}>ACCEPTED</Badge>;
    case "REJECTED":
      return <Badge variant="rejected" className={className}>REJECTED</Badge>;
    case "WITHDRAWN":
      return <Badge variant="withdrawn" className={className}>WITHDRAWN</Badge>;
    case "NEEDS_CHANGES":
      return <Badge variant="needs_changes" className={className}>NEEDS CHANGES</Badge>;
    default:
      return <Badge variant="outline" className={className}>{status}</Badge>;
  }
}
