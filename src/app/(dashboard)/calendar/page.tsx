"use client";

import { CalendarView } from "@/components/calendar/calendar-view";
import { ShareRequestLinkCard } from "@/components/settings/share-request-link";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            Your schedule, tasks, and connected calendar events.
          </p>
        </div>
      </div>

      <ShareRequestLinkCard />

      <CalendarView />
    </div>
  );
}
