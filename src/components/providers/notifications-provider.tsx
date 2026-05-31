"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Notification } from "@/types";
import { useUser } from "@/components/providers/user-provider";
import { TASKS_STALE_MS } from "@/lib/cache/client-cache";
import { parseNotificationFromJson } from "@/lib/notifications/serialize";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: (options?: { force?: boolean }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAtRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const refreshNotifications = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;
      const isFresh =
        hasLoadedRef.current &&
        Date.now() - lastFetchedAtRef.current < TASKS_STALE_MS;

      if (!force && isFresh) {
        return;
      }

      if (fetchInFlightRef.current) {
        await fetchInFlightRef.current;
        return;
      }

      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      setError(null);

      const fetchPromise = (async () => {
        try {
          const response = await fetch("/api/notifications", {
            cache: "no-store",
          });
          if (!response.ok) {
            throw new Error("Failed to load notifications");
          }

          const data = (await response.json()) as {
            notifications: Notification[];
          };
          setNotifications(data.notifications.map(parseNotificationFromJson));
          lastFetchedAtRef.current = Date.now();
          hasLoadedRef.current = true;
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load notifications",
          );
          if (!hasLoadedRef.current) {
            setNotifications([]);
          }
        } finally {
          setLoading(false);
          fetchInFlightRef.current = null;
        }
      })();

      fetchInFlightRef.current = fetchPromise;
      await fetchPromise;
    },
    [],
  );

  useEffect(() => {
    hasLoadedRef.current = false;
    lastFetchedAtRef.current = 0;
    void refreshNotifications({ force: true });
  }, [currentUser.id, refreshNotifications]);

  useEffect(() => {
    const handleRefresh = () => void refreshNotifications();
    const handlePoll = () => void refreshNotifications({ force: true });

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleRefresh();
      }
    });

    const interval = window.setInterval(handlePoll, 30_000);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.clearInterval(interval);
    };
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    const previous = notifications;
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      const data = (await response.json()) as { notification: Notification };
      const saved = parseNotificationFromJson(data.notification);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? saved : notification,
        ),
      );
    } catch {
      setNotifications(previous);
      setError("Failed to mark notification as read");
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const previous = notifications;
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );

    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
    } catch {
      setNotifications(previous);
      setError("Failed to mark all notifications as read");
    }
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
}
