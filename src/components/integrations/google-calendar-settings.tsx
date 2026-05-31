"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarSync,
  ExternalLink,
  Loader2,
  Unlink,
} from "lucide-react";
import { useGoogleIntegrationStatus } from "@/hooks/use-google-calendar";
import { invalidateGoogleCalendarCache } from "@/lib/cache/google-calendar-cache";
import { useUser } from "@/components/providers/user-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const GOOGLE_MESSAGES: Record<string, string> = {
  access_denied: "Google access was denied.",
  missing_code: "Google did not return an authorization code.",
  invalid_state: "OAuth state was invalid. Please try again.",
  token_exchange_failed: "Could not complete Google sign-in.",
};

export function GoogleCalendarSettings() {
  const searchParams = useSearchParams();
  const { currentUser } = useUser();
  const { status, loading, refresh } = useGoogleIntegrationStatus();
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncUpdating, setSyncUpdating] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const googleStatus = searchParams.get("google");
    const message = searchParams.get("message");

    if (googleStatus === "connected") {
      setBanner({
        type: "success",
        message: "Google Calendar connected successfully.",
      });
      invalidateGoogleCalendarCache(currentUser.id);
      void refresh({ force: true });
    } else if (googleStatus === "error") {
      setBanner({
        type: "error",
        message:
          (message && GOOGLE_MESSAGES[message]) ||
          "Failed to connect Google Calendar.",
      });
    }
  }, [searchParams, refresh, currentUser.id]);

  const handleConnect = () => {
    window.location.href = "/api/integrations/google/authorize";
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const response = await fetch("/api/integrations/google/disconnect", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Disconnect failed");
      setBanner({
        type: "success",
        message: "Google Calendar disconnected.",
      });
      invalidateGoogleCalendarCache(currentUser.id);
      await refresh({ force: true });
    } catch {
      setBanner({
        type: "error",
        message: "Could not disconnect Google Calendar.",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncToggle = async (enabled: boolean) => {
    setSyncUpdating(true);
    try {
      const response = await fetch("/api/integrations/google/disconnect", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncEnabled: enabled }),
      });
      if (!response.ok) throw new Error("Sync update failed");
      invalidateGoogleCalendarCache(currentUser.id);
      await refresh({ force: true });
    } catch {
      setBanner({
        type: "error",
        message: "Could not update sync settings.",
      });
    } finally {
      setSyncUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarSync className="size-5" />
          <CardTitle>Google Calendar</CardTitle>
        </div>
        <CardDescription>
          Sync your Google Calendar to view external events alongside tasks.
          Provider Google events appear as anonymous busy blocks for clients.
          Reconnect after updates if the AI assistant cannot create Google events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {banner && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              banner.type === "success"
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{banner.message}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Checking connection…
          </div>
        ) : status?.configured === false ? (
          <div className="space-y-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <p>
              Google OAuth is not configured. Add these to your{" "}
              <code className="rounded bg-muted px-1">.env</code> file:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {`GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=your-random-secret`}
            </pre>
            <p>
              Create credentials in{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                Google Cloud Console
                <ExternalLink className="size-3" />
              </a>{" "}
              and enable the Google Calendar API.
            </p>
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              If calendar sync fails with an authentication error, disconnect and
              connect again to refresh Google permissions (needed after app updates).
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">Connected</Badge>
              {status.calendarEmail && (
                <span className="text-sm text-muted-foreground">
                  {status.calendarEmail}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="google-sync">Show on calendar</Label>
                <p className="text-xs text-muted-foreground">
                  Display synced Google events in your calendar view
                </p>
              </div>
              <Switch
                id="google-sync"
                checked={status.syncEnabled}
                disabled={syncUpdating}
                onCheckedChange={handleSyncToggle}
              />
            </div>

            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Unlink className="size-4" />
              )}
              Disconnect Google Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {status?.error === "database_unavailable" && (
              <p className="text-sm text-amber-700">
                Cannot reach the database. Ensure Docker is running:{" "}
                <code className="rounded bg-muted px-1">docker start caltask-db</code>
                , then restart the dev server.
              </p>
            )}
            {status?.error === "database_error" && (
              <p className="text-sm text-amber-700">
                Database client error — restart the dev server after running{" "}
                <code className="rounded bg-muted px-1">npm run db:generate</code>
                {status.message ? `: ${status.message}` : "."}
              </p>
            )}
            <Button onClick={handleConnect}>
              <CalendarSync className="size-4" />
              Connect Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
