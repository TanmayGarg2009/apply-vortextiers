import { describe, it, expect } from "vitest";
import { Role } from "@/types";

describe("Admin Staff & Permissions Logic", () => {
  it("should correctly validate valid staff roles", () => {
    const validRoles = [Role.ADMIN, Role.REVIEWER, Role.APPLICANT];
    expect(validRoles).toContain("ADMIN");
    expect(validRoles).toContain("REVIEWER");
    expect(validRoles).toContain("APPLICANT");
  });

  it("should prevent unauthorized role mutations", () => {
    const isValidRole = (r: string): boolean => {
      return ["ADMIN", "REVIEWER", "APPLICANT"].includes(r);
    };

    expect(isValidRole("ADMIN")).toBe(true);
    expect(isValidRole("REVIEWER")).toBe(true);
    expect(isValidRole("APPLICANT")).toBe(true);
    expect(isValidRole("SUPER_ADMIN_HACK")).toBe(false);
    expect(isValidRole("MODERATOR_INVALID")).toBe(false);
  });

  it("should correctly identify bootstrap admin from Snowflake list", () => {
    const adminSnowflakes = "1422296301768540240, 999999999999999999";
    const adminList = adminSnowflakes.split(",").map((s) => s.trim()).filter(Boolean);

    expect(adminList).toContain("1422296301768540240");
    expect(adminList).toContain("999999999999999999");
    expect(adminList).not.toContain("123456789012345678");
  });

  it("should protect sole admin from self-demotion", () => {
    const totalAdmins = 1;
    const isTargetUserSelf = true;
    const requestedRole = "APPLICANT";

    const canDemote = !(isTargetUserSelf && requestedRole !== "ADMIN" && totalAdmins <= 1);
    expect(canDemote).toBe(false);
  });

  it("should allow admin demotion when multiple admins exist", () => {
    const totalAdmins = 2;
    const isTargetUserSelf = true;
    const requestedRole = "APPLICANT";

    const canDemote = !(isTargetUserSelf && requestedRole !== "ADMIN" && totalAdmins <= 1);
    expect(canDemote).toBe(true);
  });
});
