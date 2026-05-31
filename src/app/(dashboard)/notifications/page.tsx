"use client";

import { Loader2 } from "lucide-react";
import { useNotifications } from "@/components/providers/notifications-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Alerts when clients submit requests or task statuses change.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={unreadCount === 0}
          onClick={() => void markAllAsRead()}
        >
          Mark all as read
        </Button>
      </div>

      {loading && notifications.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading notifications…
        </div>
      )}

      {error && <p className="text-sm text-amber-700">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inbox</CardTitle>
          <CardDescription>
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  if (!notification.isRead) {
                    void markAsRead(notification.id);
                  }
                }}
                className={`flex w-full items-start justify-between gap-4 rounded-lg border p-4 text-left transition-colors ${
                  notification.isRead ? "bg-background" : "bg-muted/60"
                } ${!notification.isRead ? "hover:bg-muted" : ""}`}
              >
                <div className="space-y-1">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {notification.type.replace(/_/g, " ")}
                </Badge>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
