import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

function setupMocks(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockUser) })
    ),
    page.route("**/api/notifications/unread", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0 }) })
    ),
    page.route("**/api/users/me", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockUser) });
      }
      if (route.request().method() === "PATCH") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...mockUser, career: "trucker" }),
        });
      }
      return route.continue();
    }),
  ]);
}

test.describe("Profile Page", () => {
  test("displays current profile with career", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/profile");

    await expect(page.getByText("TestUser")).toBeVisible();
    await expect(page.getByText("farmer", { exact: false })).toBeVisible();
  });

  test("shows career selection options", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/profile");

    await expect(page.getByText("Farmer")).toBeVisible();
    await expect(page.getByText("Trucker")).toBeVisible();
    await expect(page.getByText("Dealer")).toBeVisible();
    await expect(page.getByText("Inspector")).toBeVisible();
  });

  test("can change career and save", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/profile");

    await page.getByText("Trucker").click();
    await page.getByText("Save Changes").click();
    await expect(page.getByText("Profile updated")).toBeVisible();
  });
});
