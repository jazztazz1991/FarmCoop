import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestBanker",
  avatarUrl: null,
  role: "member",
  career: "banker",
};

const mockBank = {
  id: "biz-1",
  ownerId: "user-1",
  ownerName: "TestBanker",
  gameServerId: "server-1",
  serverName: "Test Server",
  type: "bank",
  name: "TestBanker's Bank",
  description: "A player-run bank",
  status: "active",
  settings: { interestRateBp: 500, maxLoanAmount: "1000000" },
  createdAt: "2026-01-01T00:00:00Z",
};

const mockApplication = {
  id: "app-1",
  businessId: "biz-1",
  businessName: "TestBanker's Bank",
  applicantId: "user-2",
  applicantName: "Borrower",
  principal: "50000",
  termMonths: 12,
  interestRateBp: 500,
  estimatedMonthlyPayment: "4280",
  status: "pending",
  denialReason: null,
  reviewedAt: null,
  createdAt: "2026-01-15T00:00:00Z",
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

test.describe("Player-Run Bank", () => {
  test("browse banks page shows bank listings", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockBank]) })
    );

    await page.goto("/dashboard/businesses/banks");

    await expect(page.getByRole("heading", { name: "Player-Run Banks" })).toBeVisible();
    await expect(page.getByText("TestBanker's Bank")).toBeVisible();
  });

  test("loan application page shows form with bank rates", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses/biz-1", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockBank) })
    );

    await page.goto("/dashboard/businesses/banks/biz-1/apply");

    await expect(page.getByText("Apply for Loan")).toBeVisible();
    await expect(page.getByText("5.00% interest")).toBeVisible();
    await expect(page.getByText("Loan Amount")).toBeVisible();
  });

  test("bank owner sees pending applications on detail page", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/businesses/biz-1", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockBank) })
    );
    await page.route("**/api/businesses/biz-1/wallet", (route) =>
      route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ balance: "500000", ledger: [] }),
      })
    );
    await page.route("**/api/businesses/biz-1/loans/applications", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockApplication]) })
    );
    await page.route("**/api/businesses/biz-1/loans", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );

    await page.goto("/dashboard/businesses/biz-1");

    await expect(page.getByText("TestBanker's Bank")).toBeVisible();
    await expect(page.getByText("$500,000")).toBeVisible();
  });
});
