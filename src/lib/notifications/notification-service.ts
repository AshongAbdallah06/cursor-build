import { prisma } from "@/lib/prisma";
import { serializeNotification } from "@/lib/notifications/serialize";

async function getSessionUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

export async function listNotificationsForUser(userId: string) {
  await getSessionUser(userId);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return notifications.map(serializeNotification);
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  await getSessionUser(userId);

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!existing) {
    throw new Error("Notification not found");
  }

  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return serializeNotification(notification);
}

export async function markAllNotificationsRead(userId: string) {
  await getSessionUser(userId);

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
