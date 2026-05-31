"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type { CalendarApi } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { Loader2 } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { useTasks } from "@/components/providers/tasks-provider";
import {
  getLastVisibleCalendarRange,
  setLastVisibleCalendarRange,
} from "@/lib/cache/google-calendar-cache";
import {
  buildCalendarEvents,
  filterCalendarEvents,
  type CalendarEventFilterId,
  type CalendarEventMeta,
} from "@/lib/calendar-events";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { CalendarEventFilter } from "@/components/calendar/calendar-event-filter";
import {
  CalendarViewSwitcher,
  type CalendarViewId,
} from "@/components/calendar/calendar-view-switcher";
import { TaskDetailDialog } from "@/components/calendar/task-detail-dialog";
import { GoogleEventDetailDialog } from "@/components/calendar/google-event-detail-dialog";
import { useGoogleCalendarEvents, useGoogleIntegrationStatus } from "@/hooks/use-google-calendar";
import type { GoogleCalendarEvent, Task } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import "./fullcalendar.css";

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const { currentUser } = useUser();
  const { tasks, getCalendarTasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { status: googleStatus } = useGoogleIntegrationStatus();
  const [currentView, setCurrentView] = useState<CalendarViewId>("dayGridMonth");
  const [eventFilter, setEventFilter] =
    useState<CalendarEventFilterId>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedGoogleEvent, setSelectedGoogleEvent] =
    useState<GoogleCalendarEvent | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false);
  const [visibleRange, setVisibleRange] = useState<{
    start: Date;
    end: Date;
  } | null>(() => getLastVisibleCalendarRange());

  const visibleTasks = useMemo(
    () => getCalendarTasks(currentUser.id),
    [getCalendarTasks, currentUser.id],
  );

  const {
    events: googleEvents,
    loading: googleLoading,
    error: googleError,
    needsReconnect: googleNeedsReconnect,
  } = useGoogleCalendarEvents({
    timeMin: visibleRange?.start ?? null,
    timeMax: visibleRange?.end ?? null,
    includeProviderBusy: false,
    enabled: Boolean(googleStatus?.connected && googleStatus?.syncEnabled),
  });

  const allEvents = useMemo(
    () => buildCalendarEvents(visibleTasks, googleEvents, currentUser.id),
    [visibleTasks, googleEvents, currentUser.id],
  );

  const events = useMemo(
    () => filterCalendarEvents(allEvents, eventFilter),
    [allEvents, eventFilter],
  );

  const handleDatesSet = (arg: DatesSetArg) => {
    const range = { start: arg.start, end: arg.end };
    setVisibleRange(range);
    setLastVisibleCalendarRange(range);
    setCurrentView(arg.view.type as CalendarViewId);
  };

  const handleViewChange = (view: CalendarViewId) => {
    setCurrentView(view);
    getCalendarApi()?.changeView(view);
  };

  const getCalendarApi = (): CalendarApi | undefined =>
    calendarRef.current?.getApi();

  const handleEventClick = (info: EventClickArg) => {
    const meta = info.event.extendedProps as CalendarEventMeta;

    if (meta.kind === "google" || meta.kind === "google-busy") {
      if (meta.googleEvent) {
        setSelectedGoogleEvent(meta.googleEvent);
        setGoogleDialogOpen(true);
      }
      return;
    }

    if (meta.kind === "task" && meta.task) {
      setSelectedTask(meta.task);
      setTaskDialogOpen(true);
    }
  };

  const handleTaskDialogChange = (open: boolean) => {
    setTaskDialogOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  };

  const handleGoogleDialogChange = (open: boolean) => {
    setGoogleDialogOpen(open);
    if (!open) {
      setSelectedGoogleEvent(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <CalendarEventFilter
            value={eventFilter}
            onChange={setEventFilter}
          />
          <CalendarLegend
            showTasks={eventFilter !== "calendar-event"}
            showBusy={false}
            showGoogle={eventFilter !== "task-request"}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarViewSwitcher value={currentView} onChange={handleViewChange} />
        </div>
      </div>

      {tasksLoading && tasks.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Loading tasks…
        </div>
      )}

      {tasksError && (
        <p className="text-xs text-amber-700">{tasksError}</p>
      )}

      {googleStatus?.connected && googleLoading && googleEvents.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Syncing Google Calendar…
        </div>
      )}

      {googleStatus?.connected && googleError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p>Google Calendar sync error: {googleError}</p>
          {googleNeedsReconnect && (
            <p className="mt-1">
              Go to{" "}
              <Link href="/settings" className="font-medium underline underline-offset-4">
                Settings
              </Link>{" "}
              → disconnect Google Calendar → connect again to refresh permissions.
            </p>
          )}
        </div>
      )}

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="caltask-calendar min-h-[650px] p-4">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              buttonText={{
                today: "Today",
              }}
              events={events}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              height="auto"
              expandRows
              nowIndicator
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
              allDaySlot
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
              }}
              dayMaxEvents={3}
              moreLinkClick="day"
              stickyHeaderDates
            />
          </div>
        </CardContent>
      </Card>

      <TaskDetailDialog
        open={taskDialogOpen}
        onOpenChange={handleTaskDialogChange}
        task={
          selectedTask
            ? (tasks.find((t) => t.id === selectedTask.id) ?? selectedTask)
            : null
        }
      />

      <GoogleEventDetailDialog
        open={googleDialogOpen}
        onOpenChange={handleGoogleDialogChange}
        event={selectedGoogleEvent}
      />
    </div>
  );
}
