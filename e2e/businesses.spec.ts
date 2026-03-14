import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestBanker",
  avatarUrl: null,
  role: "member",
  career: "banker",
};

const mockBusinesses = [
  {
    id: "biz-1",
    ownerId: "user-1",
    ownerName: "TestBanker",
    gameServerId: "server-1",
    serverName: "Test Server",
    type: "bank",
    name: "TestBanker's Bank",
    description: "A player-run bank",
    status: "active",
    settings: {},
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "biz-2",
    ownerId: "user-2",
    ownerName: "TruckerDave",
    gameServerId: "server-1",
    serverName: "Test Server",
    type: "trucking",
    name: "Dave's Hauling",
    description: "Fast deliveries",
    status: "active",
    settings: {},
    createdAt: "2026-01-02T00:00:00Z",
  },
];

const mockServers = [
  { id: "server-1", name: "Test Server" },
  { id: "server-2", name: "Another Server" },
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
        body: JSON.stringify({ count: 0 }),
      })
    ),
    page.route("**/api/wallet", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balance: "100000" }),
      })
    ),
    page.route("**/api/farms/mine", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    ),
    page.route("**/api/transactions**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    ),
    page.route("**/api/servers", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockServers),
      })
    ),
  ]);
}

test.describe("Businesses", () => {
  test("browse page shows businesses with type filters", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses?**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBusinesses),
      })
    );
    await page.route("**/api/businesses", (route) => {
      if (route.request().url().includes("?")) return route.continue();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBusinesses),
      });
    });

    await page.goto("/dashboard/businesses");

    await expect(
      page.getByRole("heading", { name: "Businesses" })
    ).toBeVisible();

    // Filter buttons
    await expect(page.getByRole("button", { name: "All Types" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Banks" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Trucking" })
    ).toBeVisible();

    // Business cards
    await expect(page.getByText("TestBanker's Bank")).toBeVisible();
    await expect(page.getByText("Dave's Hauling")).toBeVisible();
  });

  test("shows empty state when no businesses", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses**", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }
      return route.continue();
    });

    await page.goto("/dashboard/businesses");

    await expect(page.getByText("No businesses found.")).toBeVisible();
  });

  test("create business page shows career-gated form", async ({ page }) => {
    await setupMocks(page);

    await page.goto("/dashboard/businesses/create");

    // Banker career should see Bank option
    await expect(page.getByText("banker")).toBeVisible();
    await expect(page.getByText("Bank")).toBeVisible();

    // Form fields
    await expect(page.getByText("Server")).toBeVisible();
    await expect(page.getByText("Business Name")).toBeVisible();
  });

  test("create business form submits successfully", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(mockBusinesses[0]),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/businesses/biz-1", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBusinesses[0]),
      })
    );
    await page.route("**/api/businesses/biz-1/wallet", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balance: "0", ledger: [] }),
      })
    );

    await page.goto("/dashboard/businesses/create");

    // Fill form
    await page.locator("select").selectOption("server-1");
    await page
      .locator('input[type="text"]')
      .fill("TestBanker's Bank");

    await page.getByRole("button", { name: "Create Bank" }).click();

    // Should navigate to detail page
    await expect(page.getByText("TestBanker's Bank")).toBeVisible();
  });

  test("business detail page shows wallet and info", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses/biz-1", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBusinesses[0]),
      })
    );
    await page.route("**/api/businesses/biz-1/wallet", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          balance: "50000",
          ledger: [
            {
              id: "e-1",
              amount: "50000",
              type: "owner_deposit",
              description: "Owner deposit",
              createdAt: "2026-01-01T00:00:00Z",
            },
          ],
        }),
      })
    );

    await page.goto("/dashboard/businesses/biz-1");

    // Business name and info
    await expect(page.getByText("TestBanker's Bank")).toBeVisible();
    await expect(page.getByText("Test Server")).toBeVisible();

    // Wallet
    await expect(page.getByText("$50,000")).toBeVisible();
    await expect(page.getByText("Owner deposit")).toBeVisible();

    // Deposit/Withdraw controls
    await expect(page.getByText("Deposit")).toBeVisible();
    await expect(page.getByText("Withdraw")).toBeVisible();
  });

  test("farmer career cannot create a business", async ({ page }) => {
    await setupMocks(page);
    // Override auth with farmer career
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...mockUser, career: "farmer" }),
      })
    );

    await page.goto("/dashboard/businesses/create");

    await expect(
      page.getByText("cannot create a business")
    ).toBeVisible();
  });
});
