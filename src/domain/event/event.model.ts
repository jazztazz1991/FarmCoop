export interface EventDTO {
  id: string;
  gameServerId: string;
  title: string;
  description: string;
  type: string;
  multiplier: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateEventInput {
  gameServerId: string;
  title: string;
  description: string;
  type: string;
  multiplier: number;
  startsAt: string;
  endsAt: string;
}
