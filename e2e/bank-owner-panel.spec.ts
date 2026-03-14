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

const mockApplicationPending = {
  id: "app-1",
  businessId: "biz-1",
  businessName: "TestBanker's Bank",
  applicantId: "user-2",
  applicantName: "Alice Farmer",
  principal: "50000",
  termMonths: 12,
  interestRateBp: 500,
  estimatedMonthlyPayment: "4280",
  status: "pending",
  denialReason: null,
  reviewedAt: null,
  createdAt: "2026-01-15T00:00:00Z",
};

const mockActiveLoan = {
  id: "loan-1",
  businessId: "biz-1",
  businessName: "TestBanker's Bank",
  borrowerId: "user-3",
  borrowerName: "Charlie Fields",
  principal: "100000",
  interestRate: 500,
  remainingBalance: "85000",
  monthlyPayment: "8750",
  termMonths: 12,
  paymentsRemaining: 10,
  status: "active",
  nextPaymentDue: "2026-03-01T00:00:00Z",
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

test.describe("Bank Owner Panel", () => {
  test("bank owner sees pending applications and can approve", async ({ page }) => {
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
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockApplicationPending]) })
    );
    await page.route("**/api/businesses/biz-1/loans", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockActiveLoan]) })
    );

    await page.goto("/dashboard/businesses/biz-1");

    await expect(page.getByText("Alice Farmer")).toBeVisible();
    await expect(page.getByText("$50,000")).toBeVisible();
    await expect(page.getByText("12 months")).toBeVisible();
    await expect(page.getByText("5.00%")).toBeVisible();
    await expect(page.getByText("Approve")).toBeVisible();
    await expect(page.getByText("Deny")).toBeVisible();
  });

  test("bank owner can switch to Active Loans tab", async ({ page }) => {
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
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockApplicationPending]) })
    );
    await page.route("**/api/businesses/biz-1/loans", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockActiveLoan]) })
    );

    await page.goto("/dashboard/businesses/biz-1");

    await page.getByRole("button", { name: "Active Loans" }).click();

    await expect(page.getByText("Charlie Fields")).toBeVisible();
    await expect(page.getByText("$100,000")).toBeVisible();
    await expect(page.getByText("$85,000")).toBeVisible();
    await expect(page.getByText("$8,750")).toBeVisible();
  });

  test("deny flow shows reason input and cancel hides it", async ({ page }) => {
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
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockApplicationPending]) })
    );
    await page.route("**/api/businesses/biz-1/loans", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );

    await page.goto("/dashboard/businesses/biz-1");

    await page.getByRole("button", { name: "Deny" }).click();
    await expect(page.getByPlaceholder("Reason for denial...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Deny" })).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByPlaceholder("Reason for denial...")).not.toBeVisible();
  });
});
