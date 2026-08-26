import { test, expect } from "@playwright/test";
import { createSessionToken } from "@/lib/auth/session";

test.describe("Admin Review Suite Flow", () => {
  test.beforeEach(async ({ context }) => {
    // Generate valid mock Admin session token
    const token = createSessionToken({
      id: "usr_admin_test",
      discordId: "1422296301768540240",
      discordUsername: "HeadTierAdmin",
      discordGlobalName: "Head Tier Admin",
      discordAvatar: null,
      email: "admin@vortextiers.xyz",
      role: "ADMIN",
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

  test("should load Admin overview dashboard with metrics", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText("Staff Applications Overview");
    await expect(page.getByText("Pending Review")).toBeVisible();
    await expect(page.getByText("Accepted Staff")).toBeVisible();
  });

  test("should navigate to Applications Management table", async ({ page }) => {
    await page.goto("/admin/applications");
    await expect(page.locator("h1")).toContainText("Applications Management");
    await expect(page.getByPlaceholder("Search by Discord, IGN, App ID, or Email...")).toBeVisible();
  });

  test("should access Question Builder", async ({ page }) => {
    await page.goto("/admin/questions");
    await expect(page.locator("h1")).toContainText("Staff Application Question Builder");
    await expect(page.getByText("Add New Question")).toBeVisible();
  });

  test("should access Platform Settings", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.locator("h1")).toContainText("Platform Settings");
    await expect(page.getByText("Accepting Staff Applications")).toBeVisible();
  });
});
