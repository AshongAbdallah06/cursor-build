import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_EVENT_COLORS,
  TASK_STATUS_LABELS,
  BUSY_SLOT_EVENT_COLORS,
  GOOGLE_CALENDAR_EVENT_COLORS,
  GOOGLE_BUSY_EVENT_COLORS,
} from "@/lib/constants";
import { getStatusLegendStatuses } from "@/lib/calendar-events";
import { Badge } from "@/components/ui/badge";

interface CalendarLegendProps {
  showBusy?: boolean;
  showGoogle?: boolean;
  showTasks?: boolean;
}

export function CalendarLegend({
  showBusy = false,
  showGoogle = false,
  showTasks = true,
}: CalendarLegendProps) {
  const statuses = getStatusLegendStatuses();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showTasks &&
        statuses.map((status) => {
          const colors = TASK_STATUS_EVENT_COLORS[status];
          return (
            <Badge
              key={status}
              variant="outline"
              className="gap-1.5 border font-normal"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: colors.border }}
              />
              {TASK_STATUS_LABELS[status]}
            </Badge>
          );
        })}
      {showBusy && (
        <Badge
          variant="outline"
          className="gap-1.5 border font-normal"
          style={{
            backgroundColor: BUSY_SLOT_EVENT_COLORS.bg,
            borderColor: BUSY_SLOT_EVENT_COLORS.border,
            color: BUSY_SLOT_EVENT_COLORS.text,
          }}
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: BUSY_SLOT_EVENT_COLORS.border }}
          />
          Busy
        </Badge>
      )}
      {showGoogle && (
        <>
          <Badge
            variant="outline"
            className="gap-1.5 border font-normal"
            style={{
              backgroundColor: GOOGLE_CALENDAR_EVENT_COLORS.bg,
              borderColor: GOOGLE_CALENDAR_EVENT_COLORS.border,
              color: GOOGLE_CALENDAR_EVENT_COLORS.text,
            }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: GOOGLE_CALENDAR_EVENT_COLORS.border }}
            />
            Google Calendar
          </Badge>
          {showBusy && (
            <Badge
              variant="outline"
              className="gap-1.5 border font-normal"
              style={{
                backgroundColor: GOOGLE_BUSY_EVENT_COLORS.bg,
                borderColor: GOOGLE_BUSY_EVENT_COLORS.border,
                color: GOOGLE_BUSY_EVENT_COLORS.text,
              }}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: GOOGLE_BUSY_EVENT_COLORS.border }}
              />
              Busy (Google)
            </Badge>
          )}
        </>
      )}
      {showTasks && (
        <Badge variant="outline" className="gap-1.5 border-red-500 font-normal">
          <span className="size-2 rounded-full bg-red-500" />
          {TASK_PRIORITY_LABELS.HIGH} priority
        </Badge>
      )}
    </div>
  );
}
