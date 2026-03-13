import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  notify,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  toDTO,
} from "../notification.service";

vi.mock("../notification.repository", () => ({
  createNotification: vi.fn(),
  findByUser: vi.fn(),
  countUnread: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));

vi.mock("../channels/discord-webhook", () => ({
  sendDiscordWebhook: vi.fn().mockResolvedValue(undefined),
}));

import * as notificationRepo from "../notification.repository";
import { sendDiscordWebhook } from "../channels/discord-webhook";

const now = new Date("2026-01-15T12:00:00Z");

function makeNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: "notif-1",
    userId: "user-1",
    type: "listing_sold",
    title: "Item Sold!",
    message: "Your Wheat x100 was purchased",
    referenceId: "listing-1",
    read: false,
    createdAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toDTO", () => {
  it("converts a notification to DTO", () => {
    const n = makeNotification();
    const dto = toDTO(n as Parameters<typeof toDTO>[0]);

    expect(dto.id).toBe("notif-1");
    expect(dto.type).toBe("listing_sold");
    expect(dto.title).toBe("Item Sold!");
    expect(dto.message).toBe("Your Wheat x100 was purchased");
    expect(dto.referenceId).toBe("listing-1");
    expect(dto.read).toBe(false);
    expect(dto.createdAt).toBe(now.toISOString());
  });
});

describe("notify", () => {
  it("creates in-app notification and fires discord webhook", async () => {
    const created = makeNotification();
    vi.mocked(notificationRepo.createNotification).mockResolvedValue(created as Parameters<typeof toDTO>[0]);

    const dto = await notify({
      userId: "user-1",
      type: "listing_sold",
      title: "Item Sold!",
      message: "Your Wheat x100 was purchased",
      referenceId: "listing-1",
    });

    expect(notificationRepo.createNotification).toHaveBeenCalledWith({
      userId: "user-1",
      type: "listing_sold",
      title: "Item Sold!",
      message: "Your Wheat x100 was purchased",
      referenceId: "listing-1",
    });
    expect(dto.id).toBe("notif-1");
    expect(sendDiscordWebhook).toHaveBeenCalledWith(
      "Item Sold!",
      "Your Wheat x100 was purchased"
    );
  });

  it("creates notification without referenceId", async () => {
    const created = makeNotification({ referenceId: null });
    vi.mocked(notificationRepo.createNotification).mockResolvedValue(created as Parameters<typeof toDTO>[0]);

    const dto = await notify({
      userId: "user-1",
      type: "transfer_received",
      title: "Transfer Received",
      message: "You received $10,000",
    });

    expect(notificationRepo.createNotification).toHaveBeenCalledWith({
      userId: "user-1",
      type: "transfer_received",
      title: "Transfer Received",
      message: "You received $10,000",
      referenceId: undefined,
    });
    expect(dto.referenceId).toBeNull();
  });

  it("does not throw if discord webhook fails", async () => {
    vi.mocked(notificationRepo.createNotification).mockResolvedValue(
      makeNotification() as Parameters<typeof toDTO>[0]
    );
    vi.mocked(sendDiscordWebhook).mockRejectedValue(new Error("Webhook failed"));

    // Should not throw
    const dto = await notify({
      userId: "user-1",
      type: "listing_sold",
      title: "Item Sold!",
      message: "Your Wheat x100 was purchased",
    });
    expect(dto.id).toBe("notif-1");
  });
});

describe("getNotifications", () => {
  it("returns notifications as DTOs", async () => {
    vi.mocked(notificationRepo.findByUser).mockResolvedValue([
      makeNotification() as Parameters<typeof toDTO>[0],
      makeNotification({ id: "notif-2", read: true }) as Parameters<typeof toDTO>[0],
    ]);

    const results = await getNotifications("user-1");
    expect(results).toHaveLength(2);
    expect(results[0].read).toBe(false);
    expect(results[1].read).toBe(true);
  });

  it("returns empty array when no notifications", async () => {
    vi.mocked(notificationRepo.findByUser).mockResolvedValue([]);
    const results = await getNotifications("user-1");
    expect(results).toHaveLength(0);
  });
});

describe("getUnreadCount", () => {
  it("returns count from repository", async () => {
    vi.mocked(notificationRepo.countUnread).mockResolvedValue(5);
    const count = await getUnreadCount("user-1");
    expect(count).toBe(5);
  });
});

describe("markRead", () => {
  it("delegates to repository with correct args", async () => {
    vi.mocked(notificationRepo.markAsRead).mockResolvedValue({ count: 1 });
    await markRead("user-1", "notif-1");
    expect(notificationRepo.markAsRead).toHaveBeenCalledWith("notif-1", "user-1");
  });
});

describe("markAllRead", () => {
  it("delegates to repository", async () => {
    vi.mocked(notificationRepo.markAllAsRead).mockResolvedValue({ count: 3 });
    await markAllRead("user-1");
    expect(notificationRepo.markAllAsRead).toHaveBeenCalledWith("user-1");
  });
});
