import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("landing page shows Get Started link to login", async ({ page }) => {
    await page.goto("/");
    const getStarted = page.getByRole("link", { name: "Get Started" });
    await expect(getStarted).toBeVisible();
    await expect(getStarted).toHaveAttribute("href", "/login");
  });

  test("login page shows Discord sign-in button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Sign in to continue")).toBeVisible();
    const discordBtn = page.getByRole("link", {
      name: "Sign in with Discord",
    });
    await expect(discordBtn).toBeVisible();
    await expect(discordBtn).toHaveAttribute("href", "/api/auth/discord");
  });

  test("login page shows error when auth cancelled", async ({ page }) => {
    await page.goto("/login?error=no_code");
    await expect(
      page.getByText("Authentication was cancelled.")
    ).toBeVisible();
  });

  test("login page shows error when auth failed", async ({ page }) => {
    await page.goto("/login?error=unknown");
    await expect(
      page.getByText("Authentication failed. Please try again.")
    ).toBeVisible();
  });

  test("dashboard redirects to login when not authenticated", async ({
    page,
  }) => {
    // Mock /api/auth/me to return 401
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: "Unauthorized" }) })
    );

    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });
});
