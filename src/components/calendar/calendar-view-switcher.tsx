"use client";

import { cn } from "@/lib/utils";

const CALENDAR_VIEWS = [
  { id: "dayGridMonth", label: "Month" },
  { id: "timeGridWeek", label: "Week" },
  { id: "timeGridDay", label: "Day" },
] as const;

export type CalendarViewId = (typeof CALENDAR_VIEWS)[number]["id"];

interface CalendarViewSwitcherProps {
  value: CalendarViewId;
  onChange: (view: CalendarViewId) => void;
  className?: string;
}

export function CalendarViewSwitcher({
  value,
  onChange,
  className,
}: CalendarViewSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-border bg-muted/60 p-1",
        className,
      )}
      role="tablist"
      aria-label="Calendar view"
    >
      {CALENDAR_VIEWS.map((view) => {
        const isActive = value === view.id;

        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(view.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground/80",
            )}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
