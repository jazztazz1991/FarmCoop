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
];

const mockContracts = [
  {
    id: "contract-1",
    gameServerId: "server-1",
    posterId: "user-2",
    posterName: "FarmerJoe",
    claimerId: null,
    claimerName: null,
    commodityId: "wheat",
    commodityName: "Wheat",
    quantity: 50,
    pricePerUnit: "100",
    totalPayout: "5000",
    status: "open",
    expiresAt: "2026-12-31T00:00:00Z",
    deliveryDeadline: null,
    claimedAt: null,
    deliveredAt: null,
    completedAt: null,
    createdAt: "2026-01-15T12:00:00Z",
  },
];

const mockMyPosted = [
  {
    id: "contract-2",
    gameServerId: "server-1",
    posterId: "user-1",
    posterName: "TestUser",
    claimerId: "user-3",
    claimerName: "Harvester",
    commodityId: "corn",
    commodityName: "Corn",
    quantity: 100,
    pricePerUnit: "80",
    totalPayout: "8000",
    status: "delivered",
    expiresAt: "2026-12-31T00:00:00Z",
    deliveryDeadline: "2026-01-20T00:00:00Z",
    claimedAt: "2026-01-16T00:00:00Z",
    deliveredAt: "2026-01-17T00:00:00Z",
    completedAt: null,
    createdAt: "2026-01-15T12:00:00Z",
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
    page.route("**/api/servers", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockServers) })
    ),
    page.route("**/api/servers/server-1/contracts", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockContracts) })
    ),
    page.route("**/api/contracts/mine?type=posted", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockMyPosted) })
    ),
    page.route("**/api/contracts/mine?type=claimed", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    ),
  ]);
}

test.describe("Contracts Board", () => {
  test("displays open contracts after server selection", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/contracts");

    await page.selectOption("select", "server-1");
    await expect(page.getByText("Wheat x50")).toBeVisible();
    await expect(page.getByText("FarmerJoe")).toBeVisible();
    await expect(page.getByText("Claim Contract")).toBeVisible();
  });

  test("claims a contract successfully", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/contracts/contract-1/claim", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...mockContracts[0], status: "claimed", claimerId: "user-1" }),
      })
    );
    // After claiming, server returns empty open list
    let claimCount = 0;
    await page.route("**/api/servers/server-1/contracts", (route) => {
      claimCount++;
      const body = claimCount > 1 ? [] : mockContracts;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });

    await page.goto("/dashboard/contracts");
    await page.selectOption("select", "server-1");
    await page.getByText("Claim Contract").click();
    await expect(page.getByText("Contract claimed")).toBeVisible();
  });

  test("shows empty state when no contracts", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/servers/server-1/contracts", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );

    await page.goto("/dashboard/contracts");
    await page.selectOption("select", "server-1");
    await expect(page.getByText("No open contracts")).toBeVisible();
  });
});

test.describe("My Contracts", () => {
  test("displays posted contracts with actions", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/contracts/mine");

    await expect(page.getByText("Corn x100")).toBeVisible();
    await expect(page.getByText("Claimed by Harvester")).toBeVisible();
    await expect(page.getByText("Confirm & Pay")).toBeVisible();
  });

  test("shows empty state for claimed tab", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/contracts/mine");

    await page.getByText("Claimed by Me").click();
    await expect(page.getByText("haven't claimed")).toBeVisible();
  });
});

test.describe("Create Contract", () => {
  test("shows the create contract form", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/contracts/create");

    await expect(page.getByText("Post a Contract")).toBeVisible();
    await expect(page.getByText("escrowed from your wallet")).toBeVisible();
  });

  test("shows total escrow calculation", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/contracts/create");

    await page.selectOption("select", "server-1");
    await page.getByPlaceholder("e.g. wheat").fill("wheat");
    await page.getByPlaceholder("e.g. Wheat").fill("Wheat");
    await page.locator('input[type="number"]').first().fill("50");
    await page.locator('input[type="number"]').last().fill("100");

    await expect(page.getByText("$5,000")).toBeVisible();
  });
});
