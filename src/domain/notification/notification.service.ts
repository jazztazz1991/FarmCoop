import type { NotificationDTO, CreateNotificationInput } from "./notification.model";
import * as notificationRepo from "./notification.repository";
import { sendDiscordWebhook } from "./channels/discord-webhook";

type RepoNotification = Awaited<ReturnType<typeof notificationRepo.findByUser>>[number];

export function toDTO(n: RepoNotification): NotificationDTO {
  return {
    id: n.id,
    type: n.type as NotificationDTO["type"],
    title: n.title,
    message: n.message,
    referenceId: n.referenceId,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function notify(input: CreateNotificationInput): Promise<NotificationDTO> {
  const notification = await notificationRepo.createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    referenceId: input.referenceId,
  });

  // Fire-and-forget Discord webhook (don't block on it)
  sendDiscordWebhook(input.title, input.message).catch(() => {});

  return toDTO(notification);
}

export async function getNotifications(userId: string): Promise<NotificationDTO[]> {
  const notifications = await notificationRepo.findByUser(userId);
  return notifications.map(toDTO);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return notificationRepo.countUnread(userId);
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  await notificationRepo.markAsRead(notificationId, userId);
}

export async function markAllRead(userId: string): Promise<void> {
  await notificationRepo.markAllAsRead(userId);
}
