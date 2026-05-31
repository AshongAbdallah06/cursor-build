"use client";

import { cn } from "@/lib/utils";
import type { CalendarEventFilterId } from "@/lib/calendar-events";

export const CALENDAR_EVENT_FILTERS: {
  id: CalendarEventFilterId;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "task-request", label: "Task request" },
  { id: "calendar-event", label: "Calendar event" },
];

interface CalendarEventFilterProps {
  value: CalendarEventFilterId;
  onChange: (filter: CalendarEventFilterId) => void;
  className?: string;
}

export function CalendarEventFilter({
  value,
  onChange,
  className,
}: CalendarEventFilterProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-border bg-muted/60 p-1",
        className,
      )}
      role="tablist"
      aria-label="Calendar event filter"
    >
      {CALENDAR_EVENT_FILTERS.map((filter) => {
        const isActive = value === filter.id;

        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground/80",
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
