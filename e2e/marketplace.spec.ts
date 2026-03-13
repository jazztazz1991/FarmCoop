import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

const mockListings = [
  {
    id: "listing-1",
    sellerId: "seller-1",
    sellerName: "FarmerJoe",
    type: "commodity",
    itemId: "WHEAT",
    itemName: "Wheat",
    quantity: 100,
    pricePerUnit: "500",
    totalPrice: "50000",
    status: "active",
    expiresAt: null,
    createdAt: "2026-01-15T12:00:00Z",
  },
  {
    id: "listing-2",
    sellerId: "seller-2",
    sellerName: "TractorKing",
    type: "equipment",
    itemId: "data/vehicles/fendt/vario900.xml",
    itemName: "Fendt Vario 900",
    quantity: 1,
    pricePerUnit: "350000",
    totalPrice: "350000",
    status: "active",
    expiresAt: null,
    createdAt: "2026-01-14T10:00:00Z",
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
    page.route("**/api/wallet", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balance: "500000" }),
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
  ]);
}

test.describe("Marketplace", () => {
  test("displays listings with search and filter controls", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.route("**/api/marketplace/listings**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockListings),
      })
    );

    await page.goto("/dashboard/marketplace");

    await expect(
      page.getByRole("heading", { name: "Marketplace" })
    ).toBeVisible();

    // Search and filter controls
    await expect(page.getByPlaceholder("Search items...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(page.getByText("All Types")).toBeVisible();

    // Listings displayed
    await expect(page.getByText("Wheat")).toBeVisible();
    await expect(page.getByText("Fendt Vario 900")).toBeVisible();
    await expect(page.getByText("FarmerJoe")).toBeVisible();
    await expect(page.getByText("TractorKing")).toBeVisible();

    // Buy buttons visible for active listings
    const buyButtons = page.getByRole("button", { name: "Buy" });
    await expect(buyButtons).toHaveCount(2);
  });

  test("shows empty state when no listings", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/marketplace/listings**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    await page.goto("/dashboard/marketplace");

    await expect(page.getByText("No listings found.")).toBeVisible();
  });

  test("can buy a listing", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/marketplace/listings**", (route) => {
      if (route.request().url().includes("/buy")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...mockListings[0], status: "sold" }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockListings),
      });
    });

    await page.goto("/dashboard/marketplace");

    // Click Buy on first listing
    const buyButtons = page.getByRole("button", { name: "Buy" });
    await buyButtons.first().click();

    await expect(page.getByText("Purchase successful")).toBeVisible();
  });

  test("shows error when buy fails", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/marketplace/listings**", (route) => {
      if (route.request().url().includes("/buy")) {
        return route.fulfill({
          status: 402,
          contentType: "application/json",
          body: JSON.stringify({ error: "Insufficient balance" }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockListings),
      });
    });

    await page.goto("/dashboard/marketplace");

    const buyButtons = page.getByRole("button", { name: "Buy" });
    await buyButtons.first().click();

    await expect(page.getByText("Insufficient balance")).toBeVisible();
  });

  test("create listing page renders form and submits", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/marketplace/listings", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(mockListings[0]),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/dashboard/marketplace/sell");

    await expect(
      page.getByRole("heading", { name: "Create Listing" })
    ).toBeVisible();

    // Fill out form
    await page.getByLabel("Item ID").fill("WHEAT");
    await page.getByLabel("Item Name").fill("Wheat");
    await page.getByLabel("Quantity").fill("100");
    await page.getByLabel("Price Per Unit ($)").fill("500");

    // Total price shown
    await expect(page.getByText("$50,000")).toBeVisible();

    // Submit
    await page.getByRole("button", { name: "Create Listing" }).click();

    await expect(page.getByText("Listing created successfully")).toBeVisible();
  });

  test("my listings page shows listings with cancel option", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.route("**/api/marketplace/listings/mine", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockListings[0]]),
      })
    );
    await page.route("**/api/marketplace/listings/**", (route) => {
      if (route.request().method() === "DELETE") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...mockListings[0], status: "cancelled" }),
        });
      }
      return route.continue();
    });

    await page.goto("/dashboard/marketplace/my-listings");

    await expect(
      page.getByRole("heading", { name: "My Listings" })
    ).toBeVisible();

    // Listing shown in table
    await expect(page.getByText("Wheat")).toBeVisible();
    await expect(page.getByText("$50,000")).toBeVisible();

    // Cancel button
    await expect(
      page.getByRole("button", { name: "Cancel" })
    ).toBeVisible();
  });
});
