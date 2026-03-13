import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

const mockNotifications = [
  {
    id: "notif-1",
    type: "listing_sold",
    title: "Item Sold!",
    message: "Your Wheat x100 was purchased for $50,000",
    referenceId: "listing-1",
    read: false,
    createdAt: "2026-01-15T12:00:00Z",
  },
  {
    id: "notif-2",
    type: "deposit_confirmed",
    title: "Deposit Confirmed",
    message: "$300,000 has been added to your wallet from the game",
    referenceId: "tx-1",
    read: true,
    createdAt: "2026-01-14T10:00:00Z",
  },
];

function setupMocks(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockUser),
      })
    ),
    page.route("**/api/notifications/unread", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 1 }),
      })
    ),
  ]);
}

test.describe("Notifications", () => {
  test("header shows unread notification badge", async ({ page }) => {
    await setupMocks(page);

    await page.route("**/api/wallet", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balance: "0" }),
      })
    );
    await page.route("**/api/farms/mine", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );
    await page.route("**/api/transactions**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    await page.goto("/dashboard");

    // Notification bell link is present
    const bellLink = page.getByRole("link", { name: "Notifications" });
    await expect(bellLink).toBeVisible();

    // Unread badge shows count
    await expect(page.getByText("1")).toBeVisible();
  });

  test("notifications page displays notifications", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/notifications", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockNotifications),
        });
      }
      // POST = mark all read
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/dashboard/notifications");

    await expect(
      page.getByRole("heading", { name: "Notifications" })
    ).toBeVisible();

    // Both notifications shown
    await expect(page.getByText("Item Sold!")).toBeVisible();
    await expect(page.getByText("Deposit Confirmed")).toBeVisible();
    await expect(
      page.getByText("Your Wheat x100 was purchased for $50,000")
    ).toBeVisible();

    // Mark all as read button (1 unread)
    await expect(page.getByText("Mark all as read")).toBeVisible();

    // Unread notification has mark read button
    const markReadButtons = page.getByRole("button", { name: "Mark read" });
    await expect(markReadButtons).toHaveCount(1);
  });

  test("shows empty state when no notifications", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/notifications", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    await page.goto("/dashboard/notifications");

    await expect(page.getByText("No notifications yet.")).toBeVisible();
  });
});
