import type { EventInput } from "@fullcalendar/core";
import type { BusySlot, GoogleCalendarEvent, Task, TaskStatus } from "@/types";
import {
  BUSY_SLOT_EVENT_COLORS,
  GOOGLE_BUSY_EVENT_COLORS,
  GOOGLE_CALENDAR_EVENT_COLORS,
  HIGH_PRIORITY_BORDER,
  TASK_STATUS_EVENT_COLORS,
} from "@/lib/constants";

export type CalendarEventKind = "task" | "busy" | "google" | "google-busy";

export type CalendarEventFilterId = "all" | "task-request" | "calendar-event";

export interface CalendarEventMeta {
  kind: CalendarEventKind;
  task?: Task;
  busySlot?: BusySlot;
  googleEvent?: GoogleCalendarEvent;
}

function getEventBorderColor(task: Task): string {
  if (task.priority === "HIGH") {
    return HIGH_PRIORITY_BORDER;
  }
  return TASK_STATUS_EVENT_COLORS[task.status].border;
}

export function taskToCalendarEvent(
  task: Task,
  options?: { showRequesterName?: boolean },
): EventInput {
  const colors = TASK_STATUS_EVENT_COLORS[task.status];
  const title =
    options?.showRequesterName && task.createdBy
      ? `${task.title} · ${task.createdBy.fullName}`
      : task.title;

  return {
    id: task.id,
    title,
    start: task.startTime,
    end: task.endTime,
    backgroundColor: colors.bg,
    borderColor: getEventBorderColor(task),
    textColor: colors.text,
    classNames:
      task.priority === "HIGH" ? ["fc-event--high-priority"] : undefined,
    extendedProps: {
      kind: "task",
      task,
    } satisfies CalendarEventMeta,
  };
}

export function busySlotToCalendarEvent(slot: BusySlot): EventInput {
  return {
    id: slot.id,
    title: "Busy",
    start: slot.startTime,
    end: slot.endTime,
    backgroundColor: BUSY_SLOT_EVENT_COLORS.bg,
    borderColor: BUSY_SLOT_EVENT_COLORS.border,
    textColor: BUSY_SLOT_EVENT_COLORS.text,
    editable: false,
    display: "block",
    extendedProps: {
      kind: "busy",
      busySlot: slot,
    } satisfies CalendarEventMeta,
  };
}

export function googleEventToCalendarEvent(
  event: GoogleCalendarEvent,
): EventInput {
  const isHidden = event.hideDetails;
  const colors = isHidden
    ? GOOGLE_BUSY_EVENT_COLORS
    : GOOGLE_CALENDAR_EVENT_COLORS;

  return {
    id: `google-${event.id}`,
    title: isHidden ? "Busy (Google)" : event.title,
    start: event.startTime,
    end: event.endTime,
    allDay: event.allDay,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    editable: false,
    classNames: isHidden ? undefined : ["fc-event--google"],
    extendedProps: {
      kind: isHidden ? "google-busy" : "google",
      googleEvent: event,
    } satisfies CalendarEventMeta,
  };
}

export function buildCalendarEvents(
  tasks: Task[],
  googleEvents: GoogleCalendarEvent[] = [],
  userId?: string,
): EventInput[] {
  const taskEvents = tasks.map((task) =>
    taskToCalendarEvent(task, {
      showRequesterName:
        Boolean(userId) &&
        task.assignedToId === userId &&
        task.createdById !== userId,
    }),
  );

  const googleCalendarEvents = googleEvents.map(googleEventToCalendarEvent);

  return [...taskEvents, ...googleCalendarEvents];
}

export function filterCalendarEvents(
  events: EventInput[],
  filter: CalendarEventFilterId,
): EventInput[] {
  if (filter === "all") {
    return events;
  }

  return events.filter((event) => {
    const meta = event.extendedProps as CalendarEventMeta | undefined;
    if (!meta) return false;

    if (filter === "task-request") {
      return meta.kind === "task";
    }

    return (
      meta.kind === "google" ||
      meta.kind === "google-busy" ||
      meta.kind === "busy"
    );
  });
}

export function getStatusLegendStatuses(): TaskStatus[] {
  return [
    "PENDING",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED",
    "DECLINED",
  ];
}
