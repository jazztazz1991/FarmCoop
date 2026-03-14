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

const mockPendingClaim = {
  id: "claim-1",
  businessId: "biz-1",
  policyId: "pol-1",
  claimAmount: "50000",
  payout: "0",
  reason: "Crop failed due to drought",
  status: "pending",
  resolvedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
};

const mockPolicy = {
  id: "pol-1",
  businessId: "biz-1",
  businessName: "Safe Farm Insurance",
  holderId: "user-2",
  holderName: "Jane Farmer",
  type: "crop",
  coverageAmount: "100000",
  premium: "5000",
  deductible: "2500",
  status: "active",
  commodityId: "corn-1",
  commodityName: "Corn",
  equipmentId: null,
  equipmentName: null,
  startsAt: "2026-01-01T00:00:00Z",
  expiresAt: "2027-01-01T00:00:00Z",
  createdAt: "2025-12-15T00:00:00Z",
};

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
    page.route("**/api/businesses/biz-1", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockInsurer),
      })
    ),
    page.route("**/api/businesses/biz-1/claims", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockPendingClaim]),
      })
    ),
    page.route("**/api/businesses/biz-1/policies", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockPolicy]),
      })
    ),
  ]);
}

test.describe("Insurance Owner Panel", () => {
  test("displays pending claims tab by default with claim details", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/businesses/insurers/biz-1");

    await expect(page.getByText("Pending Claims")).toBeVisible();
    await expect(page.getByText("Policies")).toBeVisible();
    await expect(page.getByText("$50,000")).toBeVisible();
    await expect(page.getByText("Crop failed due to drought")).toBeVisible();
    await expect(page.getByText("Approve")).toBeVisible();
    await expect(page.getByText("Deny")).toBeVisible();
  });

  test("switches to policies tab and shows policy details", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/businesses/insurers/biz-1");

    await page.getByText("Policies").click();

    await expect(page.getByText("Crop Insurance")).toBeVisible();
    await expect(page.getByText("Holder: Jane Farmer")).toBeVisible();
    await expect(page.getByText("$100,000")).toBeVisible();
    await expect(page.getByText("$5,000")).toBeVisible();
    await expect(page.getByText("$2,500")).toBeVisible();
    await expect(page.getByText("active")).toBeVisible();
    await expect(page.getByText("Corn")).toBeVisible();
  });

  test("approve claim sends correct review payload", async ({ page }) => {
    await setupMocks(page);

    let reviewPayload: unknown = null;
    await page.route("**/api/businesses/biz-1/claims/claim-1/review", (route) => {
      reviewPayload = JSON.parse(route.request().postData() ?? "{}");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/dashboard/businesses/insurers/biz-1");

    await page.getByPlaceholder("Enter payout amount...").fill("40000");
    await page.getByText("Approve").click();

    await expect
      .poll(() => reviewPayload)
      .toEqual({ decision: "approve", payout: "40000" });
  });

  test("deny claim sends correct review payload", async ({ page }) => {
    await setupMocks(page);

    let reviewPayload: unknown = null;
    await page.route("**/api/businesses/biz-1/claims/claim-1/review", (route) => {
      reviewPayload = JSON.parse(route.request().postData() ?? "{}");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/dashboard/businesses/insurers/biz-1");

    await page.getByText("Deny").click();

    await expect
      .poll(() => reviewPayload)
      .toEqual({ decision: "deny" });
  });

  test("shows validation error when approving without payout amount", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/businesses/insurers/biz-1");

    await page.getByText("Approve").click();

    await expect(
      page.getByText("Please enter a valid payout amount")
    ).toBeVisible();
  });
});
