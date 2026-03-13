import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

const mockFarms = [
  {
    id: "farm-1",
    name: "My Farm",
    farmSlot: 3,
    serverName: "Test Server",
    gameServerId: "server-1",
  },
];

async function setupAuthMock(page: import("@playwright/test").Page) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockUser),
    })
  );
  await page.route("**/api/notifications/unread", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 0 }),
    })
  );
}

test.describe("Dashboard", () => {
  test("shows overview page with wallet, farms, and transactions", async ({
    page,
  }) => {
    await setupAuthMock(page);

    await page.route("**/api/wallet", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balance: "150000" }),
      })
    );

    await page.route("**/api/farms/mine", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockFarms),
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

    // Header shows user name
    await expect(page.getByText("TestUser")).toBeVisible();

    // Wallet balance
    await expect(page.getByText("$150,000")).toBeVisible();

    // Farm card
    await expect(page.getByRole("heading", { name: "My Farm", exact: true })).toBeVisible();
    await expect(page.getByText("Slot 3", { exact: true })).toBeVisible();

    // Sidebar navigation
    await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Send" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Transactions" })).toBeVisible();
    await expect(page.getByRole("link", { name: "My Farms" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Wallet" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Marketplace" })).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await setupAuthMock(page);

    // Mock all data endpoints
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
    await page.route("**/api/servers", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );
    await page.route("**/api/wallet/ledger", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );
    await page.route("**/api/marketplace/listings", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    await page.goto("/dashboard");
    await expect(page.getByText("Overview")).toBeVisible();

    // Navigate to Wallet
    await page.getByRole("link", { name: "Wallet" }).click();
    await page.waitForURL("**/dashboard/wallet");
    await expect(page.getByRole("heading", { name: "Wallet", exact: true })).toBeVisible();

    // Navigate to My Farms (use sidebar link, not the "Go to My Farms" in wallet page)
    await page.getByRole("link", { name: "My Farms", exact: true }).first().click();
    await page.waitForURL("**/dashboard/farms");
    await expect(page.getByRole("heading", { name: "My Farms" })).toBeVisible();

    // Navigate to Transactions
    await page.getByRole("link", { name: "Transactions" }).click();
    await page.waitForURL("**/dashboard/transactions");
    await expect(
      page.getByRole("heading", { name: "Transactions" })
    ).toBeVisible();
  });

  test("shows user initial when no avatar", async ({ page }) => {
    await setupAuthMock(page);

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
    // Should show "T" initial for "TestUser"
    await expect(page.getByText("T", { exact: true })).toBeVisible();
  });
});
