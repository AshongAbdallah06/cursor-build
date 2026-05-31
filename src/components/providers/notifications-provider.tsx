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
import {
  getCachedNotifications,
  invalidateNotificationsCache,
  isNotificationsFresh,
  setCachedNotifications,
} from "@/lib/cache/dashboard-cache";
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
  const cachedEntry = getCachedNotifications(currentUser.id);
  const [notifications, setNotifications] = useState<Notification[]>(
    () => cachedEntry?.data ?? [],
  );
  const [loading, setLoading] = useState(() => !cachedEntry);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(Boolean(cachedEntry));
  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const refreshNotifications = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;

      if (!force && isNotificationsFresh(currentUser.id)) {
        const entry = getCachedNotifications(currentUser.id);
        if (entry) {
          setNotifications(entry.data);
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }
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
          const parsed = data.notifications.map(parseNotificationFromJson);
          setCachedNotifications(currentUser.id, parsed);
          setNotifications(parsed);
          hasLoadedRef.current = true;
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load notifications",
          );
          const entry = getCachedNotifications(currentUser.id);
          if (entry) {
            setNotifications(entry.data);
            hasLoadedRef.current = true;
          } else if (!hasLoadedRef.current) {
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
    [currentUser.id],
  );

  useEffect(() => {
    hasLoadedRef.current = Boolean(getCachedNotifications(currentUser.id));
    void refreshNotifications({ force: !isNotificationsFresh(currentUser.id) });
  }, [currentUser.id, refreshNotifications]);

  useEffect(() => {
    const handleRefresh = () => void refreshNotifications();

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleRefresh();
      }
    });

    return () => {
      window.removeEventListener("focus", handleRefresh);
    };
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    const previous = notifications;
    setNotifications((current) => {
      const next = current.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      );
      setCachedNotifications(currentUser.id, next);
      return next;
    });

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      const data = (await response.json()) as { notification: Notification };
      const saved = parseNotificationFromJson(data.notification);
      setNotifications((current) => {
        const next = current.map((notification) =>
          notification.id === id ? saved : notification,
        );
        setCachedNotifications(currentUser.id, next);
        return next;
      });
    } catch {
      setNotifications(previous);
      setCachedNotifications(currentUser.id, previous);
      setError("Failed to mark notification as read");
    }
  }, [currentUser.id, notifications]);

  const markAllAsRead = useCallback(async () => {
    const previous = notifications;
    const next = previous.map((notification) => ({
      ...notification,
      isRead: true,
    }));
    setNotifications(next);
    setCachedNotifications(currentUser.id, next);

    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
    } catch {
      setNotifications(previous);
      setCachedNotifications(currentUser.id, previous);
      setError("Failed to mark all notifications as read");
    }
  }, [currentUser.id, notifications]);

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
