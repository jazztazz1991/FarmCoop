import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

const mockRichest = [
  { rank: 1, userId: "u1", displayName: "RichFarmer", avatarUrl: null, career: "farmer", value: "500000" },
  { rank: 2, userId: "u2", displayName: "WealthyTrader", avatarUrl: null, career: "dealer", value: "350000" },
  { rank: 3, userId: "u3", displayName: "SteadyTrucker", avatarUrl: null, career: "trucker", value: "200000" },
];

const mockTraders = [
  { rank: 1, userId: "u2", displayName: "WealthyTrader", avatarUrl: null, career: "dealer", value: "42" },
];

function setupMocks(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockUser) })
    ),
    page.route("**/api/notifications/unread", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0 }) })
    ),
    page.route("**/api/leaderboard?type=richest*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockRichest) })
    ),
    page.route("**/api/leaderboard?type=top_traders*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockTraders) })
    ),
    page.route("**/api/leaderboard?type=top_contractors*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    ),
  ]);
}

test.describe("Leaderboard Page", () => {
  test("displays richest leaderboard by default", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/leaderboard");

    await expect(page.getByText("RichFarmer")).toBeVisible();
    await expect(page.getByText("WealthyTrader")).toBeVisible();
    await expect(page.getByText("SteadyTrucker")).toBeVisible();
  });

  test("switches to top traders tab", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/leaderboard");

    await page.getByText("Top Traders").click();
    await expect(page.getByText("WealthyTrader")).toBeVisible();
    await expect(page.getByText("42")).toBeVisible();
  });

  test("shows empty state for top contractors", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/leaderboard");

    await page.getByText("Top Contractors").click();
    await expect(page.getByText("No entries yet")).toBeVisible();
  });
});
