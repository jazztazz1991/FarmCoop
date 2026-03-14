import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestDealer",
  avatarUrl: null,
  role: "member",
  career: "dealer",
};

const mockDealership = {
  id: "biz-1",
  ownerId: "user-1",
  ownerName: "TestDealer",
  gameServerId: "server-1",
  serverName: "Test Server",
  type: "dealership",
  name: "TestDealer's Lot",
  description: "Quality vehicles",
  status: "active",
  settings: {},
  createdAt: "2026-01-01T00:00:00Z",
};

const mockInventory = [
  {
    id: "item-1",
    businessId: "biz-1",
    businessName: "TestDealer's Lot",
    itemId: "fendt900",
    itemName: "Fendt Vario 900",
    category: "equipment",
    quantity: 1,
    pricePerUnit: "350000",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

function setupMocks(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockUser) })
    ),
    page.route("**/api/notifications/unread", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0 }) })
    ),
    page.route("**/api/wallet", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ balance: "500000" }) })
    ),
    page.route("**/api/farms/mine", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "farm-1", name: "My Farm" }]) })
    ),
    page.route("**/api/transactions**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    ),
  ]);
}

test.describe("Player-Run Dealership", () => {
  test("browse dealerships page", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockDealership]) })
    );

    await page.goto("/dashboard/businesses/dealerships");

    await expect(page.getByRole("heading", { name: "Player-Run Dealerships" })).toBeVisible();
    await expect(page.getByText("TestDealer's Lot")).toBeVisible();
  });

  test("dealership storefront shows inventory", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses/biz-1", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockDealership) })
    );
    await page.route("**/api/businesses/biz-1/inventory", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockInventory) })
    );

    await page.goto("/dashboard/businesses/dealerships/biz-1");

    await expect(page.getByText("TestDealer's Lot")).toBeVisible();
    await expect(page.getByText("Fendt Vario 900")).toBeVisible();
    await expect(page.getByText("$350,000")).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy" })).toBeVisible();
  });

  test("shows empty state for no inventory", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses/biz-1", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockDealership) })
    );
    await page.route("**/api/businesses/biz-1/inventory", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );

    await page.goto("/dashboard/businesses/dealerships/biz-1");

    await expect(page.getByText("No items in stock.")).toBeVisible();
  });
});
