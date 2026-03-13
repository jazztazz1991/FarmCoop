import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

const mockServers = [
  { id: "server-1", name: "Main Server" },
  { id: "server-2", name: "Test Server" },
];

const mockPrices = [
  {
    commodityId: "wheat",
    commodityName: "Wheat",
    basePrice: "1000",
    currentPrice: "1200",
    supply: 10,
    demand: 15,
    updatedAt: "2026-01-15T12:00:00Z",
  },
  {
    commodityId: "corn",
    commodityName: "Corn",
    basePrice: "800",
    currentPrice: "700",
    supply: 20,
    demand: 12,
    updatedAt: "2026-01-15T12:00:00Z",
  },
];

const mockHistory = [
  { price: "1200", supply: 10, demand: 15, recordedAt: "2026-01-15T12:00:00Z" },
  { price: "1100", supply: 12, demand: 14, recordedAt: "2026-01-14T12:00:00Z" },
];

function setupMocks(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockUser) })
    ),
    page.route("**/api/notifications/unread", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0 }) })
    ),
    page.route("**/api/servers", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockServers) })
    ),
    page.route("**/api/servers/server-1/prices", (route) => {
      if (route.request().url().includes("/history")) return route.continue();
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockPrices) });
    }),
    page.route("**/api/servers/server-1/prices/wheat/history", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockHistory) })
    ),
  ]);
}

test.describe("Prices Page", () => {
  test("displays commodity prices after server selection", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/prices");

    await page.selectOption("select", "server-1");
    await expect(page.getByText("Wheat")).toBeVisible();
    await expect(page.getByText("Corn")).toBeVisible();
    await expect(page.getByText("+20%")).toBeVisible();
  });

  test("shows price history when clicking a commodity", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/prices");

    await page.selectOption("select", "server-1");
    await page.getByText("Wheat").click();
    await expect(page.getByText("Price History")).toBeVisible();
  });

  test("shows empty state when no prices configured", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/servers/server-2/prices", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );

    await page.goto("/dashboard/prices");
    await page.selectOption("select", "server-2");
    await expect(page.getByText("No commodity prices configured")).toBeVisible();
  });
});
