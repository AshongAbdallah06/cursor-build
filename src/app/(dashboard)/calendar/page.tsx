"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { CalendarView } from "@/components/calendar/calendar-view";
import { ShareRequestLinkCard } from "@/components/settings/share-request-link";
import { buildPublicRequestUrl } from "@/lib/requests/public-request";
import { MOCK_USER_IDS } from "@/lib/mock-data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { currentUser, isProvider } = useUser();
  const requestUrl = buildPublicRequestUrl(MOCK_USER_IDS.provider);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            {isProvider
              ? "Full schedule — all client tasks and personal events."
              : "Your requested tasks plus provider busy slots."}
          </p>
        </div>
        {!isProvider && (
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
