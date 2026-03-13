import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

const mockRecipes = [
  {
    id: "recipe-1",
    name: "Sawmill",
    outputItemName: "Planks",
    outputQuantity: 5,
    processingTime: 300,
    inputs: [{ itemId: "LOGS", itemName: "Logs", quantity: 10 }],
  },
];

const mockFactories = [
  {
    id: "factory-1",
    gameServerId: "server-1",
    ownerId: "user-1",
    recipeId: "recipe-1",
    recipeName: "Sawmill",
    name: "My Sawmill",
    cyclesRun: 5,
    createdAt: "2026-03-12T00:00:00Z",
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
    page.route("**/api/recipes", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockRecipes),
      })
    ),
    page.route("**/api/servers/server-1/factories", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockFactories),
      })
    ),
  ]);
}

test.describe("Production Page", () => {
  test("displays production page with tabs", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/production");

    await expect(page.getByText("Production")).toBeVisible();
    await expect(page.getByText("My Factories")).toBeVisible();
    await expect(page.getByText("Recipes")).toBeVisible();
    await expect(page.getByText("Create Factory")).toBeVisible();
  });

  test("factories tab shows factory data after selecting server", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/production");

    await page.selectOption("select", "server-1");
    await expect(page.getByText("My Sawmill")).toBeVisible();
    await expect(page.getByText("Sawmill")).toBeVisible();
    await expect(page.getByText("5")).toBeVisible();
  });

  test("recipes tab shows recipe data after selecting server", async ({
    page,
  }) => {
    await setupMocks(page);
    await page.goto("/dashboard/production");

    await page.selectOption("select", "server-1");
    await page.getByText("Recipes").click();

    await expect(page.getByText("Sawmill")).toBeVisible();
    await expect(page.getByText("5x Planks")).toBeVisible();
    await expect(page.getByText("10x Logs")).toBeVisible();
    await expect(page.getByText("5m")).toBeVisible();
  });
});
