"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { CalendarCheck, Loader2 } from "lucide-react";
import { TaskRequestForm } from "@/components/request/task-request-form";
import { APP_NAME } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProviderInfo {
  id: string;
  fullName: string;
}

export function TaskRequestPageContent() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get("provider");
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(providerId));
  const [error, setError] = useState<string | null>(
    providerId
      ? null
      : "This link is missing a provider. Ask the person you want to book with for their share link.",
  );
  const [submitted, setSubmitted] = useState<{
    title: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  useEffect(() => {
    if (!providerId) return;

    const resolvedProviderId = providerId;

    async function loadProvider() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/public/task-requests?providerId=${encodeURIComponent(resolvedProviderId)}`,
        );
        if (!response.ok) {
          throw new Error("Provider not found");
        }
        const data = (await response.json()) as { provider: ProviderInfo };
        setProvider(data.provider);
      } catch {
        setError("This request link is invalid or the provider was not found.");
        setProvider(null);
      } finally {
        setLoading(false);
      }
    }

    void loadProvider();
  }, [providerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
            Sign in to CalTask
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-green-600" />
            <CardTitle>Request submitted</CardTitle>
          </div>
          <CardDescription>
            Your request for time with {provider.fullName} has been sent. You
            will be notified when the status changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium">{submitted.title}</p>
            <p className="text-muted-foreground">
              {formatScheduleRange(
                new Date(submitted.startTime),
                new Date(submitted.endTime),
              )}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSubmitted(null)}>
            Submit another request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TaskRequestForm
      provider={provider}
      onSuccess={(task) =>
        setSubmitted({
          title: task.title,
          startTime:
            typeof task.startTime === "string"
              ? task.startTime
              : task.startTime.toISOString(),
          endTime:
            typeof task.endTime === "string"
              ? task.endTime
              : task.endTime.toISOString(),
        })
      }
    />
  );
}

export function TaskRequestPageHeader() {
  return (
    <div className="mb-8 text-center">
      <Link href="/login" className="text-lg font-semibold tracking-tight">
        {APP_NAME}
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">
        Request time on someone&apos;s calendar
      </p>
    </div>
  );
}

function formatScheduleRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) {
    return `${format(start, "EEEE, MMMM d, yyyy · h:mm a")} – ${format(end, "h:mm a")}`;
  }

  return `${format(start, "MMM d, yyyy · h:mm a")} – ${format(end, "MMM d, yyyy · h:mm a")}`;
}
