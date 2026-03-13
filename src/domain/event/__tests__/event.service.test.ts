import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createEvent,
  getActiveEvents,
  getUpcomingEvents,
  getAllEvents,
  cancelEvent,
  getActiveMultiplier,
  toDTO,
} from "../event.service";

vi.mock("../event.repository", () => ({
  createEvent: vi.fn(),
  findActiveEvents: vi.fn(),
  findUpcomingEvents: vi.fn(),
  findAllEvents: vi.fn(),
  findEventById: vi.fn(),
  cancelEvent: vi.fn(),
}));

import * as eventRepo from "../event.repository";

const mockRepo = eventRepo as unknown as {
  createEvent: ReturnType<typeof vi.fn>;
  findActiveEvents: ReturnType<typeof vi.fn>;
  findUpcomingEvents: ReturnType<typeof vi.fn>;
  findAllEvents: ReturnType<typeof vi.fn>;
  findEventById: ReturnType<typeof vi.fn>;
  cancelEvent: ReturnType<typeof vi.fn>;
};

const SERVER = "server-1";

function makeRepoEvent(overrides = {}) {
  return {
    id: "event-1",
    gameServerId: SERVER,
    title: "Wheat Rush",
    description: "Double wheat contract payouts!",
    type: "bonus_payout",
    multiplier: 2.0,
    startsAt: new Date("2026-03-01T00:00:00Z"),
    endsAt: new Date("2026-03-07T00:00:00Z"),
    isActive: true,
    createdAt: new Date("2026-02-28T00:00:00Z"),
    ...overrides,
  };
}

describe("toDTO", () => {
  it("converts repo event to DTO with ISO dates", () => {
    const dto = toDTO(makeRepoEvent());
    expect(dto).toEqual({
      id: "event-1",
      gameServerId: SERVER,
      title: "Wheat Rush",
      description: "Double wheat contract payouts!",
      type: "bonus_payout",
      multiplier: 2.0,
      startsAt: "2026-03-01T00:00:00.000Z",
      endsAt: "2026-03-07T00:00:00.000Z",
      isActive: true,
      createdAt: "2026-02-28T00:00:00.000Z",
    });
  });
});

describe("createEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates and creates an event", async () => {
    mockRepo.createEvent.mockResolvedValue(makeRepoEvent());

    const result = await createEvent({
      gameServerId: SERVER,
      title: "Wheat Rush",
      description: "Double wheat contract payouts!",
      type: "bonus_payout",
      multiplier: 2.0,
      startsAt: "2026-03-01T00:00:00Z",
      endsAt: "2026-03-07T00:00:00Z",
    });

    expect(result.title).toBe("Wheat Rush");
    expect(mockRepo.createEvent).toHaveBeenCalledWith({
      gameServerId: SERVER,
      title: "Wheat Rush",
      description: "Double wheat contract payouts!",
      type: "bonus_payout",
      multiplier: 2.0,
      startsAt: new Date("2026-03-01T00:00:00Z"),
      endsAt: new Date("2026-03-07T00:00:00Z"),
    });
  });

  it("rejects if end date is before start date", async () => {
    await expect(
      createEvent({
        gameServerId: SERVER,
        title: "Bad Event",
        description: "Invalid dates",
        type: "custom",
        multiplier: 1.5,
        startsAt: "2026-03-07T00:00:00Z",
        endsAt: "2026-03-01T00:00:00Z",
      })
    ).rejects.toThrow("End date must be after start date");
  });

  it("rejects invalid event type", async () => {
    await expect(
      createEvent({
        gameServerId: SERVER,
        title: "Bad",
        description: "Invalid type",
        type: "invalid_type" as unknown as string,
        multiplier: 1.0,
        startsAt: "2026-03-01T00:00:00Z",
        endsAt: "2026-03-07T00:00:00Z",
      })
    ).rejects.toThrow();
  });

  it("rejects multiplier out of range", async () => {
    await expect(
      createEvent({
        gameServerId: SERVER,
        title: "Bad",
        description: "Too high",
        type: "custom",
        multiplier: 15,
        startsAt: "2026-03-01T00:00:00Z",
        endsAt: "2026-03-07T00:00:00Z",
      })
    ).rejects.toThrow();
  });
});

describe("getActiveEvents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns active events as DTOs", async () => {
    mockRepo.findActiveEvents.mockResolvedValue([makeRepoEvent()]);
    const result = await getActiveEvents(SERVER);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Wheat Rush");
  });

  it("returns empty array when no active events", async () => {
    mockRepo.findActiveEvents.mockResolvedValue([]);
    const result = await getActiveEvents(SERVER);
    expect(result).toEqual([]);
  });
});

describe("getUpcomingEvents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns upcoming events", async () => {
    mockRepo.findUpcomingEvents.mockResolvedValue([
      makeRepoEvent({ startsAt: new Date("2026-04-01T00:00:00Z") }),
    ]);
    const result = await getUpcomingEvents(SERVER);
    expect(result).toHaveLength(1);
  });
});

describe("getAllEvents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all events for admin view", async () => {
    mockRepo.findAllEvents.mockResolvedValue([
      makeRepoEvent(),
      makeRepoEvent({ id: "event-2", isActive: false }),
    ]);
    const result = await getAllEvents(SERVER);
    expect(result).toHaveLength(2);
  });
});

describe("cancelEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancels an existing event", async () => {
    mockRepo.findEventById.mockResolvedValue(makeRepoEvent());
    mockRepo.cancelEvent.mockResolvedValue(makeRepoEvent({ isActive: false }));

    const result = await cancelEvent("event-1");
    expect(result.isActive).toBe(false);
  });

  it("throws if event not found", async () => {
    mockRepo.findEventById.mockResolvedValue(null);
    await expect(cancelEvent("nonexistent")).rejects.toThrow("Event not found");
  });
});

describe("getActiveMultiplier", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns highest multiplier from active events", async () => {
    mockRepo.findActiveEvents.mockResolvedValue([
      makeRepoEvent({ multiplier: 1.5 }),
      makeRepoEvent({ multiplier: 2.0 }),
    ]);
    const result = await getActiveMultiplier(SERVER);
    expect(result).toBe(2.0);
  });

  it("returns 1.0 when no active events", async () => {
    mockRepo.findActiveEvents.mockResolvedValue([]);
    const result = await getActiveMultiplier(SERVER);
    expect(result).toBe(1.0);
  });
});
