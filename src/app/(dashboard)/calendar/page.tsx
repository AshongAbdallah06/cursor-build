"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { CalendarView } from "@/components/calendar/calendar-view";
import { ShareRequestLinkCard } from "@/components/settings/share-request-link";
import { buildPublicRequestUrl } from "@/lib/requests/public-request";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { isProvider } = useUser();
  const [requestUrl, setRequestUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isProvider) return;

    void fetch("/api/providers/for-client")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as {
          provider?: { id: string };
        };
        return data.provider?.id ?? null;
      })
      .then((providerId) => {
        if (providerId) {
          setRequestUrl(buildPublicRequestUrl(providerId));
        }
      })
      .catch(() => setRequestUrl(null));
  }, [isProvider]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            {isProvider
              ? "Full schedule — all client tasks and personal events."
              : "Your tasks and calendar events."}
          </p>
        </div>
        {!isProvider && requestUrl && (
          <Link
            href={requestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants())}
          >
            <Plus className="size-4" />
            Request time
          </Link>
        )}
      </div>

      {isProvider && <ShareRequestLinkCard />}

      <CalendarView />
    </div>
  );
}
