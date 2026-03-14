import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestInsurer",
  avatarUrl: null,
  role: "member",
  career: "inspector",
};

const mockInsurer = {
  id: "biz-1",
  ownerId: "user-1",
  ownerName: "TestInsurer",
  gameServerId: "server-1",
  serverName: "Test Server",
  type: "insurance",
  name: "Safe Farm Insurance",
  description: "Protect your crops",
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
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    ),
    page.route("**/api/transactions**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    ),
  ]);
}

test.describe("Player-Run Insurance", () => {
  test("browse insurers page", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockInsurer]) })
    );

    await page.goto("/dashboard/businesses/insurers");

    await expect(page.getByRole("heading", { name: "Player-Run Insurance Companies" })).toBeVisible();
    await expect(page.getByText("Safe Farm Insurance")).toBeVisible();
  });

  test("insurer storefront shows policies", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses/biz-1", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockInsurer) })
    );
    await page.route("**/api/businesses/biz-1/policies", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );

    await page.goto("/dashboard/businesses/insurers/biz-1");

    await expect(page.getByText("Safe Farm Insurance")).toBeVisible();
    await expect(page.getByText("No policies yet.")).toBeVisible();
  });
});
