import { describe, it, expect } from "vitest";
import {
  renderSubmittedEmail,
  renderAcceptedEmail,
  renderRejectedEmail,
} from "@/lib/email/templates";

describe("Email Templates Generator", () => {
  const baseData = {
    applicantName: "VortexContender",
    applicationId: "VT-000142",
    positionName: "Tier Tester",
    modeName: "Crystal",
    appUrl: "https://apply.vortextiers.xyz",
  };

  it("should render application submitted email with correct details", () => {
    const email = renderSubmittedEmail(baseData);

    expect(email.subject).toContain("VT-000142");
    expect(email.subject).toContain("Application Received");
    expect(email.text).toContain("VortexContender");
    expect(email.text).toContain("Tier Tester");
    expect(email.text).toContain("Crystal");
    expect(email.html).toContain("VT-000142");
    expect(email.html).toContain("SUBMITTED");
  });

  it("should render application accepted email with custom remarks", () => {
    const email = renderAcceptedEmail({
      ...baseData,
      acceptanceMessage: "Welcome to the Crystal testing team! Please check #staff-announcements on Discord.",
    });

    expect(email.subject).toContain("Accepted");
    expect(email.text).toContain("Welcome to the Crystal testing team!");
    expect(email.html).toContain("STATUS: ACCEPTED");
    expect(email.html).toContain("Welcome to the Crystal testing team!");
  });

  it("should render application rejected email with constructive feedback", () => {
    const email = renderRejectedEmail({
      ...baseData,
      rejectionReason: "Need more verified gameplay clips in Crystal PvP. Feel free to re-apply in 14 days.",
    });

    expect(email.subject).toContain("Update regarding your Vortex Tiers Staff Application");
    expect(email.subject).toContain("VT-000142");
    expect(email.text).toContain("Need more verified gameplay clips");
    expect(email.html).toContain("Reviewer Feedback:");
    expect(email.html).toContain("reapply in the future");
  });
});
