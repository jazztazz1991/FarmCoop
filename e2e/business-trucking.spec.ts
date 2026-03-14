import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestTrucker",
  avatarUrl: null,
  role: "member",
  career: "trucker",
};

const mockTrucker = {
  id: "biz-1",
  ownerId: "user-1",
  ownerName: "TestTrucker",
  gameServerId: "server-1",
  serverName: "Test Server",
  type: "trucking",
  name: "Fast Haulers",
  description: "Quick deliveries",
  status: "active",
  settings: {},
  createdAt: "2026-01-01T00:00:00Z",
};

function setupMocks(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockUser) })
    ),
    page.route("**/api/notifications/unread", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0 }) })
    ),
    page.route("**/api/wallet", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ balance: "100000" }) })
    ),
    page.route("**/api/farms/mine", (route) =>
      route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify([{ id: "farm-1", name: "My Farm", farmSlot: 2, serverName: "Test Server" }]),
      })
    ),
    page.route("**/api/transactions**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    ),
  ]);
}

test.describe("Player-Run Trucking", () => {
  test("browse trucking companies page", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockTrucker]) })
    );

    await page.goto("/dashboard/businesses/trucking");

    await expect(page.getByRole("heading", { name: "Player-Run Trucking Companies" })).toBeVisible();
    await expect(page.getByText("Fast Haulers")).toBeVisible();
  });

  test("delivery request page renders form", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses/biz-1", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockTrucker) })
    );

    await page.goto("/dashboard/businesses/trucking/biz-1/request");

    await expect(page.getByText("Request Delivery")).toBeVisible();
    await expect(page.getByText("Fast Haulers")).toBeVisible();
    await expect(page.getByText("Destination Farm")).toBeVisible();
    await expect(page.getByText("Item Description")).toBeVisible();
  });
});
