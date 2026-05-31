import type { Notification, NotificationType } from "@/types";

type PrismaNotification = {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
};

export function serializeNotification(
  notification: PrismaNotification,
): Notification {
  return {
    id: notification.id,
    userId: notification.userId,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

export function parseNotificationFromJson(
  notification: Notification,
): Notification {
  return {
    ...notification,
    createdAt: new Date(notification.createdAt),
  };
}

export function serializeNotificationForJson(notification: Notification) {
  return {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  };
}
