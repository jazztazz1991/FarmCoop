import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

const mockLoans = [
  {
    id: "loan-1",
    principal: "50000",
    remainingBalance: "35000",
    monthlyPayment: "2500",
    interestRate: "5.5",
    paymentsRemaining: 14,
    status: "active",
    nextPaymentDue: "2026-04-01T00:00:00Z",
  },
  {
    id: "loan-2",
    principal: "20000",
    remainingBalance: "0",
    monthlyPayment: "1000",
    interestRate: "4.0",
    paymentsRemaining: 0,
    status: "paid_off",
    nextPaymentDue: null,
  },
];

const mockSavings = {
  balance: "125000",
  apyBasisPoints: 200,
};

const mockCertificates = [
  {
    id: "cd-1",
    principal: "10000",
    apyBasisPoints: 500,
    termDays: 90,
    maturesAt: "2026-06-15T00:00:00Z",
    status: "active",
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
        body: JSON.stringify({ count: 0 }),
      })
    ),
    page.route("**/api/servers", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: "server-1", name: "Main Server" }]),
      })
    ),
    page.route("**/api/banking/loans*", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockLoans),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    }),
    page.route("**/api/banking/savings*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSavings),
      })
    ),
    page.route("**/api/banking/certificates*", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockCertificates),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    }),
  ]);
}

test.describe("Banking Page", () => {
  test("displays banking page with tabs", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/banking");

    await expect(page.getByText("Banking")).toBeVisible();
    await expect(page.getByText("Loans")).toBeVisible();
    await expect(page.getByText("Savings")).toBeVisible();
    await expect(page.getByText("CDs")).toBeVisible();
  });

  test("loans tab shows loan data after selecting server", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/banking");

    await page.selectOption("select", "server-1");
    await expect(page.getByText("$50,000")).toBeVisible();
    await expect(page.getByText("$35,000")).toBeVisible();
    await expect(page.getByText("Paid Off")).toBeVisible();
  });

  test("savings tab shows balance after selecting server", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/banking");

    await page.selectOption("select", "server-1");
    await page.getByText("Savings").click();

    await expect(page.getByText("$125,000")).toBeVisible();
    await expect(page.getByText("2.00% APY")).toBeVisible();
  });

  test("CDs tab shows certificate data after selecting server", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/banking");

    await page.selectOption("select", "server-1");
    await page.getByText("CDs").click();

    await expect(page.getByText("$10,000")).toBeVisible();
    await expect(page.getByText("5.00%")).toBeVisible();
    await expect(page.getByText("90 days")).toBeVisible();
  });

  test("shows Apply for Loan button on loans tab", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/banking");

    await page.selectOption("select", "server-1");
    await expect(page.getByText("Apply for Loan")).toBeVisible();
  });

  test("shows Open CD button on CDs tab", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/banking");

    await page.selectOption("select", "server-1");
    await page.getByText("CDs").click();

    await expect(page.getByText("Open CD").first()).toBeVisible();
  });
});
