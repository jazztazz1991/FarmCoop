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
  {
    id: "farm-2",
    name: "Second Farm",
    farmSlot: 5,
    serverName: "Test Server",
    gameServerId: "server-1",
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
    page.route("**/api/farms/mine", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockFarms),
      })
    ),
  ]);
}

test.describe("Send Transaction", () => {
  test("shows farm selection prompt when no farms", async ({ page }) => {
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
    await page.route("**/api/farms/mine", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    await page.goto("/dashboard/send");
    await expect(
      page.getByText("You need to claim a farm before you can send transactions.")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to My Farms" })).toBeVisible();
  });

  test("shows send form with farm dropdown when farms exist", async ({
    page,
  }) => {
    await setupMocks(page);

    await page.goto("/dashboard/send");
    await expect(
      page.getByRole("heading", { name: "Send Money or Equipment" })
    ).toBeVisible();

    // Type toggle buttons
    await expect(page.getByRole("button", { name: "Money" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Equipment" })).toBeVisible();

    // Farm dropdown has our farms
    const select = page.locator("select");
    await expect(select).toBeVisible();
    await expect(select).toContainText("My Farm (Slot 3)");
    await expect(select).toContainText("Second Farm (Slot 5)");
  });

  test("sends a money transaction successfully", async ({ page }) => {
    await setupMocks(page);

    // Mock the POST to create transaction
    await page.route("**/api/transactions", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "tx-new",
            type: "money",
            farmId: 3,
            amount: 50000,
            status: "pending",
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/dashboard/send");

    // Select farm
    await page.locator("select").selectOption("farm-1");

    // Enter amount
    await page.getByPlaceholder("Enter amount...").fill("50000");

    // Submit
    await page.getByRole("button", { name: "Send" }).click();

    // Should redirect to transactions page
    await page.waitForURL("**/dashboard/transactions");
  });

  test("switches to equipment mode and shows equipment input", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/send");

    // Click Equipment toggle
    await page.getByRole("button", { name: "Equipment" }).click();

    // Should show equipment ID input instead of amount
    await expect(
      page.getByPlaceholder("e.g. vehicle.johnDeere.8R")
    ).toBeVisible();
    await expect(page.getByPlaceholder("Enter amount...")).not.toBeVisible();
  });

  test("shows error on failed transaction", async ({ page }) => {
    await setupMocks(page);

    await page.route("**/api/transactions", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Insufficient balance" }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/dashboard/send");

    await page.locator("select").selectOption("farm-1");
    await page.getByPlaceholder("Enter amount...").fill("999999");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("Insufficient balance")).toBeVisible();
  });
});
