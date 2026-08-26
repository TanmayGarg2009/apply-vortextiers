import { describe, it, expect } from "vitest";
import { ApplicationStatus } from "@/types";

describe("Application State Machine Transitions", () => {
  const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["UNDER_REVIEW", "WITHDRAWN"],
    UNDER_REVIEW: ["ACCEPTED", "REJECTED", "NEEDS_CHANGES"],
    NEEDS_CHANGES: ["SUBMITTED"],
    ACCEPTED: [],
    REJECTED: [],
    WITHDRAWN: [],
  };

  function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
    return allowedTransitions[from]?.includes(to) ?? false;
  }

  it("should permit DRAFT -> SUBMITTED", () => {
    expect(canTransition("DRAFT", "SUBMITTED")).toBe(true);
  });

  it("should permit SUBMITTED -> UNDER_REVIEW", () => {
    expect(canTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("should permit UNDER_REVIEW -> ACCEPTED and UNDER_REVIEW -> REJECTED", () => {
    expect(canTransition("UNDER_REVIEW", "ACCEPTED")).toBe(true);
    expect(canTransition("UNDER_REVIEW", "REJECTED")).toBe(true);
    expect(canTransition("UNDER_REVIEW", "NEEDS_CHANGES")).toBe(true);
  });

  it("should reject illegal transitions (e.g. DRAFT -> ACCEPTED)", () => {
    expect(canTransition("DRAFT", "ACCEPTED")).toBe(false);
    expect(canTransition("DRAFT", "REJECTED")).toBe(false);
    expect(canTransition("ACCEPTED", "SUBMITTED")).toBe(false);
    expect(canTransition("REJECTED", "UNDER_REVIEW")).toBe(false);
  });
});
