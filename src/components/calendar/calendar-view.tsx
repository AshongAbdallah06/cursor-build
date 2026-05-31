"use client";

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
  invalidateGoogleCalendarCache,
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
import {
  CalendarAssistantPanel,
  CalendarAssistantToggle,
} from "@/components/calendar/calendar-assistant-panel";
import { useGoogleCalendarEvents, useGoogleIntegrationStatus } from "@/hooks/use-google-calendar";
import type { BusySlot, GoogleCalendarEvent, Task } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import "./fullcalendar.css";

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const { currentUser, isProvider } = useUser();
  const { tasks, getTasksForUser, getBusySlotsForClient, loading: tasksLoading, error: tasksError, refreshTasks } = useTasks();
  const { status: googleStatus } = useGoogleIntegrationStatus();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [currentView, setCurrentView] = useState<CalendarViewId>("dayGridMonth");
  const [eventFilter, setEventFilter] =
    useState<CalendarEventFilterId>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedBusySlot, setSelectedBusySlot] = useState<BusySlot | null>(
    null,
  );
  const [selectedGoogleEvent, setSelectedGoogleEvent] =
    useState<GoogleCalendarEvent | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false);
  const [visibleRange, setVisibleRange] = useState<{
    start: Date;
    end: Date;
  } | null>(() => getLastVisibleCalendarRange());

  const visibleTasks = useMemo(
    () => getTasksForUser(currentUser.id, currentUser.role),
    [getTasksForUser, currentUser.id, currentUser.role],
  );

  const busySlots = useMemo(
    () => (isProvider ? [] : getBusySlotsForClient(currentUser.id)),
    [isProvider, getBusySlotsForClient, currentUser.id],
  );

  const {
    events: googleEvents,
    providerBusyEvents,
    loading: googleLoading,
    error: googleError,
    refresh: refreshGoogleEvents,
  } = useGoogleCalendarEvents({
    timeMin: visibleRange?.start ?? null,
    timeMax: visibleRange?.end ?? null,
    includeProviderBusy: !isProvider,
    enabled: Boolean(googleStatus?.connected && googleStatus?.syncEnabled),
  });

  const mergedGoogleEvents = useMemo(
    () => [...googleEvents, ...providerBusyEvents],
    [googleEvents, providerBusyEvents],
  );

  const allEvents = useMemo(
    () =>
      buildCalendarEvents(
        visibleTasks,
        busySlots,
        isProvider,
        mergedGoogleEvents,
      ),
    [visibleTasks, busySlots, isProvider, mergedGoogleEvents],
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

    if (meta.kind === "busy" && meta.busySlot) {
      setSelectedTask(null);
      setSelectedBusySlot(meta.busySlot);
      setTaskDialogOpen(true);
      return;
    }

    if (meta.kind === "task" && meta.task) {
      setSelectedBusySlot(null);
      setSelectedTask(meta.task);
      setTaskDialogOpen(true);
    }
  };

  const handleTaskDialogChange = (open: boolean) => {
    setTaskDialogOpen(open);
    if (!open) {
      setSelectedTask(null);
      setSelectedBusySlot(null);
    }
  };

  const handleGoogleDialogChange = (open: boolean) => {
    setGoogleDialogOpen(open);
    if (!open) {
      setSelectedGoogleEvent(null);
    }
  };

  const handleCalendarUpdated = () => {
    invalidateGoogleCalendarCache(currentUser.id);
    void refreshTasks({ force: true });
    void refreshGoogleEvents();
  };

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
      {assistantOpen && (
        <div className="order-1 w-full xl:order-2 xl:w-[380px] xl:shrink-0">
          <CalendarAssistantPanel
            open={assistantOpen}
            onClose={() => setAssistantOpen(false)}
            onCalendarUpdated={handleCalendarUpdated}
          />
        </div>
      )}

      <div className="order-2 min-w-0 flex-1 space-y-4 xl:order-1">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <CalendarEventFilter
            value={eventFilter}
            onChange={setEventFilter}
          />
          <CalendarLegend
            showTasks={eventFilter !== "calendar-event"}
            showBusy={!isProvider && eventFilter !== "task-request"}
            showGoogle={eventFilter !== "task-request"}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarAssistantToggle
            open={assistantOpen}
            onToggle={() => setAssistantOpen((current) => !current)}
          />
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

      {googleStatus?.connected && googleLoading && mergedGoogleEvents.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Syncing Google Calendar…
        </div>
      )}

      {googleStatus?.connected && googleError && (
        <p className="text-xs text-amber-700">
          Google Calendar sync error: {googleError}
        </p>
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
        busySlot={selectedBusySlot}
      />

      <GoogleEventDetailDialog
        open={googleDialogOpen}
        onOpenChange={handleGoogleDialogChange}
        event={selectedGoogleEvent}
      />
      </div>
    </div>
  );
}
