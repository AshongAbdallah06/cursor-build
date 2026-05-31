import type { Notification, Task } from "@/types";
import {
  ClientCache,
  NOTIFICATIONS_STALE_MS,
  TASKS_STALE_MS,
} from "@/lib/cache/client-cache";

const tasksCache = new ClientCache<Task[]>();
const notificationsCache = new ClientCache<Notification[]>();

export function getCachedTasks(userId: string) {
  return tasksCache.get(userId);
}

export function setCachedTasks(userId: string, tasks: Task[]) {
  tasksCache.set(userId, tasks);
}

export function isTasksFresh(userId: string) {
  return tasksCache.isFresh(userId, TASKS_STALE_MS);
}

export function invalidateTasksCache(userId?: string) {
  if (userId) {
    tasksCache.invalidate(userId);
    return;
  }
  tasksCache.invalidate();
}

export function getCachedNotifications(userId: string) {
  return notificationsCache.get(userId);
}

export function setCachedNotifications(userId: string, notifications: Notification[]) {
  notificationsCache.set(userId, notifications);
}

export function isNotificationsFresh(userId: string) {
  return notificationsCache.isFresh(userId, NOTIFICATIONS_STALE_MS);
}

export function invalidateNotificationsCache(userId?: string) {
  if (userId) {
    notificationsCache.invalidate(userId);
    return;
  }
  notificationsCache.invalidate();
}

export function invalidateDashboardCache(userId?: string) {
  invalidateTasksCache(userId);
  invalidateNotificationsCache(userId);
}
