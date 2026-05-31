"use client";

import { Suspense } from "react";
import { mockClients, mockProvider, useUser } from "@/components/providers/user-provider";
import { GoogleCalendarSettings } from "@/components/integrations/google-calendar-settings";
import { ShareRequestLinkCard } from "@/components/settings/share-request-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { currentUser, switchUser, isProvider } = useUser();

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
          <CardDescription>Your account information</CardDescription>
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
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant={isProvider ? "default" : "secondary"}>
              {currentUser.role}
            </Badge>
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
          <CardTitle>Dev: Switch user role</CardTitle>
          <CardDescription>
            Toggle between provider and client views. Your selection is stored
            in a session cookie for Google Calendar OAuth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant={currentUser.id === mockProvider.id ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => switchUser(mockProvider.id)}
          >
            {mockProvider.fullName}
            <Badge className="ml-auto" variant="secondary">
              PROVIDER
            </Badge>
          </Button>
          {mockClients.map((client) => (
            <Button
              key={client.id}
              variant={currentUser.id === client.id ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => switchUser(client.id)}
            >
              {client.fullName}
              <Badge className="ml-auto" variant="secondary">
                CLIENT
              </Badge>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database</CardTitle>
          <CardDescription>PostgreSQL via Prisma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Google Calendar tokens are stored in the database. Set{" "}
            <code className="rounded bg-muted px-1">DATABASE_URL</code> in{" "}
            <code className="rounded bg-muted px-1">.env</code>, then run:
          </p>
          <Separator />
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
            {`npm run db:migrate
npm run db:seed`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
