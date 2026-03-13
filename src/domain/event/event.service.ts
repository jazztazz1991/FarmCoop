import type { EventDTO, CreateEventInput } from "./event.model";
import { createEventSchema } from "./event.validator";
import * as eventRepo from "./event.repository";

type RepoEvent = Awaited<ReturnType<typeof eventRepo.findActiveEvents>>[number];

export function toDTO(e: RepoEvent): EventDTO {
  return {
    id: e.id,
    gameServerId: e.gameServerId,
    title: e.title,
    description: e.description,
    type: e.type,
    multiplier: e.multiplier,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    isActive: e.isActive,
    createdAt: e.createdAt.toISOString(),
  };
}

/** Create a new event (admin only) */
export async function createEvent(input: CreateEventInput): Promise<EventDTO> {
  const parsed = createEventSchema.parse(input);

  const startsAt = new Date(parsed.startsAt);
  const endsAt = new Date(parsed.endsAt);

  if (endsAt <= startsAt) {
    throw new Error("End date must be after start date");
  }

  const event = await eventRepo.createEvent({
    gameServerId: parsed.gameServerId,
    title: parsed.title,
    description: parsed.description,
    type: parsed.type,
    multiplier: parsed.multiplier,
    startsAt,
    endsAt,
  });

  return toDTO(event);
}

/** Get currently active events for a server */
export async function getActiveEvents(gameServerId: string): Promise<EventDTO[]> {
  const events = await eventRepo.findActiveEvents(gameServerId);
  return events.map(toDTO);
}

/** Get upcoming events for a server */
export async function getUpcomingEvents(gameServerId: string): Promise<EventDTO[]> {
  const events = await eventRepo.findUpcomingEvents(gameServerId);
  return events.map(toDTO);
}

/** Get all events for a server (admin) */
export async function getAllEvents(gameServerId: string): Promise<EventDTO[]> {
  const events = await eventRepo.findAllEvents(gameServerId);
  return events.map(toDTO);
}

/** Cancel an event */
export async function cancelEvent(eventId: string): Promise<EventDTO> {
  const existing = await eventRepo.findEventById(eventId);
  if (!existing) throw new Error("Event not found");

  const updated = await eventRepo.cancelEvent(eventId);
  return toDTO(updated);
}

/** Get the active multiplier for a server (highest multiplier from active events, or 1.0) */
export async function getActiveMultiplier(gameServerId: string): Promise<number> {
  const events = await eventRepo.findActiveEvents(gameServerId);
  if (events.length === 0) return 1.0;
  return Math.max(...events.map((e) => e.multiplier));
}
