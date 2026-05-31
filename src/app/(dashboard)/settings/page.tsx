"use client";

import { Suspense } from "react";
import { useUser } from "@/components/providers/user-provider";
import { GoogleCalendarSettings } from "@/components/integrations/google-calendar-settings";
import { ShareRequestLinkCard } from "@/components/settings/share-request-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { currentUser } = useUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Profile, calendar integrations, and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your signed-in account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{currentUser.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{currentUser.email}</span>
          </div>
        </CardContent>
      </Card>

      <ShareRequestLinkCard />

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading integrations…
            </CardContent>
          </Card>
        }
      >
        <GoogleCalendarSettings />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Database</CardTitle>
          <CardDescription>PostgreSQL via Prisma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Each signed-in user gets their own workspace. Run{" "}
            <code className="rounded bg-muted px-1">npm run db:migrate:deploy</code>{" "}
            after deploying schema changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
