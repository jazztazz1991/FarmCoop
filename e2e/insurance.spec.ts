import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

const mockPolicies = [
  {
    id: "policy-1",
    type: "crop",
    coverageAmount: "100000",
    premiumPaid: "5000",
    deductible: "2000",
    status: "active",
    expiresAt: "2026-12-31T00:00:00Z",
    commodityName: "Wheat",
    equipmentName: null,
  },
];

const mockClaims = [
  {
    id: "claim-1",
    claimAmount: "25000",
    payout: "20000",
    reason: "Hail damage to wheat crop",
    status: "approved",
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
    page.route("**/api/insurance/policies*", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockPolicies),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    }),
    page.route("**/api/insurance/claims*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockClaims),
      })
    ),
    page.route("**/api/insurance/premiums*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ premium: "5000" }),
      })
    ),
  ]);
}

test.describe("Insurance Page", () => {
  test("displays insurance page with tabs", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/insurance");

    await expect(page.getByText("Insurance")).toBeVisible();
    await expect(page.getByText("My Policies")).toBeVisible();
    await expect(page.getByText("My Claims")).toBeVisible();
    await expect(page.getByText("Purchase")).toBeVisible();
  });

  test("policies tab shows policy data after selecting server", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/insurance");

    await page.selectOption("select", "server-1");
    await expect(page.getByText("$100,000")).toBeVisible();
    await expect(page.getByText("Crop")).toBeVisible();
    await expect(page.getByText("Wheat")).toBeVisible();
    await expect(page.getByText("File Claim")).toBeVisible();
  });

  test("claims tab shows claim data after selecting server", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/insurance");

    await page.selectOption("select", "server-1");
    await page.getByText("My Claims").click();

    await expect(page.getByText("$25,000")).toBeVisible();
    await expect(page.getByText("$20,000")).toBeVisible();
    await expect(page.getByText("Approved")).toBeVisible();
    await expect(page.getByText("Hail damage to wheat crop")).toBeVisible();
  });

  test("purchase tab shows form and premium calculator", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/insurance");

    await page.selectOption("select", "server-1");
    await page.getByText("Purchase").click();

    await expect(page.getByText("Purchase Policy")).toBeVisible();
    await expect(page.getByText("Premium Calculator")).toBeVisible();
  });
});
