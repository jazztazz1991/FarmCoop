import { test, expect } from "@playwright/test";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: null,
  role: "member",
  career: "farmer",
};

const mockServers = [{ id: "server-1", name: "Main Server" }];

const mockActiveEvents = [
  {
    id: "event-1",
    gameServerId: "server-1",
    title: "Wheat Rush Weekend",
    description: "Double payouts on wheat contracts!",
    type: "bonus_payout",
    multiplier: 2.0,
    startsAt: "2026-03-10T00:00:00Z",
    endsAt: "2026-03-14T00:00:00Z",
    isActive: true,
    createdAt: "2026-03-09T00:00:00Z",
  },
];

const mockUpcomingEvents = [
  {
    id: "event-2",
    gameServerId: "server-1",
    title: "Spring Harvest Festival",
    description: "Bonus prices for all crops",
    type: "double_prices",
    multiplier: 1.5,
    startsAt: "2026-04-01T00:00:00Z",
    endsAt: "2026-04-07T00:00:00Z",
    isActive: true,
    createdAt: "2026-03-09T00:00:00Z",
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
    page.route("**/api/servers/server-1/events?view=active", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockActiveEvents) })
    ),
    page.route("**/api/servers/server-1/events?view=upcoming", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockUpcomingEvents) })
    ),
  ]);
}

test.describe("Events Page", () => {
  test("displays active and upcoming events after server selection", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard/events");

    await page.selectOption("select", "server-1");
    await expect(page.getByText("Wheat Rush Weekend")).toBeVisible();
    await expect(page.getByText("2x")).toBeVisible();
    await expect(page.getByText("Spring Harvest Festival")).toBeVisible();
  });

  test("shows empty state when no events", async ({ page }) => {
    await setupMocks(page);
    await page.route("**/api/servers/server-1/events?view=active", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );
    await page.route("**/api/servers/server-1/events?view=upcoming", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );

    await page.goto("/dashboard/events");
    await page.selectOption("select", "server-1");
    await expect(page.getByText("No events scheduled")).toBeVisible();
  });
});
