import { test, expect } from "@playwright/test";

test.describe("Public Home Page", () => {
  test("should render Vortex Tiers branding and staff positions", async ({ page }) => {
    await page.goto("/");

    // Verify Title and Heading
    await expect(page).toHaveTitle(/Vortex Tiers Staff Applications/);
    await expect(page.locator("h1")).toContainText("Vortex Tiers");

    // Verify Open Staff Roles
    await expect(page.getByText("Tier Tester")).toBeVisible();
    await expect(page.getByText("Moderator")).toBeVisible();

    // Verify Supported Game Modes Badges
    await expect(page.getByText("Crystal")).toBeVisible();
    await expect(page.getByText("Netherite Pot")).toBeVisible();
    await expect(page.getByText("Pot (Nodebuff)")).toBeVisible();
    await expect(page.getByText("Sword")).toBeVisible();
  });
});
