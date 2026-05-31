import { format } from "date-fns";
import {
  createGoogleEventForUser,
  getGoogleIntegrationStatus,
  getScheduleContextForUser,
} from "@/lib/integrations/calendar-integration";
import { createAssistantSchedule } from "@/lib/tasks/task-service";
import type { ScheduleEventResult } from "@/lib/ai/types";
import type { TaskPriority } from "@/types";

export const CALENDAR_ASSISTANT_TOOLS = [
  {
    name: "get_schedule",
    description:
      "Get the user's tasks and Google Calendar events for a date range. Use this before scheduling or when answering availability questions.",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
        },
        endDate: {
          type: "string",
          description: "End date in YYYY-MM-DD format",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "schedule_event",
    description:
      "Create a calendar block on the user's CalTask calendar and sync it to Google Calendar when connected. Confirm details with the user before calling unless they gave explicit times.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event or task title" },
        description: {
          type: "string",
          description: "Optional details about the event",
        },
        startTime: {
          type: "string",
          description: "ISO 8601 datetime for start, e.g. 2026-06-01T09:00:00",
        },
        endTime: {
          type: "string",
          description: "ISO 8601 datetime for end",
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH"],
          description: "Task priority (defaults to MEDIUM)",
        },
        syncToGoogle: {
          type: "boolean",
          description:
            "Whether to also create the event in Google Calendar (default true when connected)",
        },
      },
      required: ["title", "startTime", "endTime"],
    },
  },
];

export async function executeCalendarTool(
  userId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<{ result: Record<string, unknown>; calendarUpdated: boolean }> {
  switch (name) {
    case "get_schedule":
      return {
        result: await handleGetSchedule(userId, args),
        calendarUpdated: false,
      };
    case "schedule_event":
      return handleScheduleEvent(userId, args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleGetSchedule(
  userId: string,
  args: Record<string, unknown>,
) {
  const startDate = String(args.startDate ?? "");
  const endDate = String(args.endDate ?? "");

  if (!startDate || !endDate) {
    throw new Error("startDate and endDate are required");
  }

  const schedule = await getScheduleContextForUser(userId, startDate, endDate);
  const googleStatus = await getGoogleIntegrationStatus(userId);

  return {
    ...schedule,
    googleConnected: googleStatus.connected && googleStatus.syncEnabled,
    googleEmail: googleStatus.calendarEmail,
  };
}

async function handleScheduleEvent(
  userId: string,
  args: Record<string, unknown>,
): Promise<{ result: Record<string, unknown>; calendarUpdated: boolean }> {
  const title = String(args.title ?? "").trim();
  const startTime = new Date(String(args.startTime ?? ""));
  const endTime = new Date(String(args.endTime ?? ""));
  const description = args.description ? String(args.description) : undefined;
  const priority = (args.priority as TaskPriority | undefined) ?? "MEDIUM";
  const syncToGoogle = args.syncToGoogle !== false;

  if (!title || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error("title, startTime, and endTime are required");
  }

  const task = await createAssistantSchedule(userId, {
    title,
    description,
    startTime,
    endTime,
    priority,
  });

  let googleEvent: ScheduleEventResult["googleEvent"] = null;
  let googleSyncError: string | null = null;

  if (syncToGoogle) {
    try {
      const created = await createGoogleEventForUser(userId, {
        title,
        description: description ?? null,
        startTime,
        endTime,
      });
      googleEvent = {
        id: created.id,
        title: created.title,
        htmlLink: created.htmlLink,
      };
    } catch (err) {
      googleSyncError =
        err instanceof Error ? err.message : "Failed to sync to Google Calendar";
    }
  }

  const result: ScheduleEventResult = {
    task: {
      id: task.id,
      title: task.title,
      startTime: task.startTime.toISOString(),
      endTime: task.endTime.toISOString(),
      status: task.status,
    },
    googleEvent,
    googleSyncError,
  };

  return {
    result: result as unknown as Record<string, unknown>,
    calendarUpdated: true,
  };
}

export function buildAssistantSystemPrompt(input: {
  userName: string;
  now: Date;
  googleConnected: boolean;
}) {
  const nowLabel = format(input.now, "EEEE, MMMM d, yyyy · h:mm a");

  return `You are CalTask's built-in calendar planning assistant for ${input.userName}.

Current date and time: ${nowLabel}

Your job is to help plan, review, and schedule calendar items through natural conversation.

Guidelines:
- Be conversational, concise, and proactive when planning.
- Before scheduling, check availability with get_schedule when the timing is unclear or might conflict.
- When the user confirms a plan, call schedule_event with accurate ISO datetimes.
- If Google Calendar is ${input.googleConnected ? "connected" : "not connected"}, ${
    input.googleConnected
      ? "sync new events to Google by default"
      : "still create CalTask entries but explain that Google sync requires connecting in Settings"
  }.
- For vague requests ("block time tomorrow afternoon"), ask clarifying questions or propose a specific slot.
- Never invent events that were not returned by get_schedule or created by schedule_event.
- After scheduling, summarize what was created and mention Google sync status if relevant.`;
}
