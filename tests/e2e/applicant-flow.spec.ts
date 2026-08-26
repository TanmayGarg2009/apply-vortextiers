import { test, expect } from "@playwright/test";
import { createSessionToken } from "@/lib/auth/session";

test.describe("Applicant Application Flow", () => {
  test.beforeEach(async ({ context }) => {
    // Generate valid mock session token
    const token = createSessionToken({
      id: "usr_applicant_test",
      discordId: "998877665544332211",
      discordUsername: "PvPApplicant",
      discordGlobalName: "PvP Applicant",
      discordAvatar: null,
      email: "applicant@vortextiers.xyz",
      role: "APPLICANT",
    });

    await context.addCookies([
      {
        name: "vt_session",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  });

  test("should load applicant dashboard with profile information", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Applicant Dashboard");
    await expect(page.getByText("PvP Applicant")).toBeVisible();
    await expect(page.getByText("New Staff Application")).toBeVisible();
  });
});
