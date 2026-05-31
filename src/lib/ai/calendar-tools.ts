import { randomUUID } from "crypto";
import { format } from "date-fns";
import {
  createGoogleEventForUser,
  getGoogleIntegrationStatus,
  getScheduleContextForUser,
} from "@/lib/integrations/calendar-integration";
import {
  createAssistantSchedule,
  validateAssistantScheduleInput,
} from "@/lib/tasks/task-service";
import type {
  AssistantScheduleDraft,
  ScheduleEventResult,
} from "@/lib/ai/types";
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
    name: "draft_event",
    description:
      "Propose a calendar event for the user to review. This does NOT add anything to the calendar — the user must tap Confirm in the UI. Use when the user wants to schedule, block time, or set a reminder.",
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
            "Whether to also create the event in Google Calendar when the user confirms (default true when connected)",
        },
      },
      required: ["title", "startTime", "endTime"],
    },
  },
];

export interface CalendarToolResult {
  result: Record<string, unknown>;
  calendarUpdated: boolean;
  pendingDraft?: AssistantScheduleDraft;
}

export async function executeCalendarTool(
  userId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<CalendarToolResult> {
  switch (name) {
    case "get_schedule":
      return {
        result: await handleGetSchedule(userId, args),
        calendarUpdated: false,
      };
    case "draft_event":
      return handleDraftEvent(userId, args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function commitAssistantScheduleDraft(
  userId: string,
  draft: AssistantScheduleDraft,
): Promise<ScheduleEventResult> {
  const parsed = parseScheduleEventArgs({
    title: draft.title,
    description: draft.description,
    startTime: draft.startTime,
    endTime: draft.endTime,
    priority: draft.priority,
    syncToGoogle: draft.syncToGoogle,
  });

  const task = await createAssistantSchedule(userId, {
    title: parsed.title,
    description: parsed.description,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    priority: parsed.priority,
  });

  let googleEvent: ScheduleEventResult["googleEvent"] = null;
  let googleSyncError: string | null = null;

  if (parsed.syncToGoogle) {
    try {
      const created = await createGoogleEventForUser(userId, {
        title: parsed.title,
        description: parsed.description ?? null,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
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

  return {
    task: {
      id: task.id,
      title: task.title,
      startTime: task.startTime?.toISOString() ?? null,
      endTime: task.endTime?.toISOString() ?? null,
      status: task.status,
    },
    googleEvent,
    googleSyncError,
  };
}

function parseScheduleEventArgs(args: Record<string, unknown>) {
  const title = String(args.title ?? "").trim();
  const startTime = new Date(String(args.startTime ?? ""));
  const endTime = new Date(String(args.endTime ?? ""));
  const description = args.description
    ? String(args.description).trim()
    : undefined;
  const priority = (args.priority as TaskPriority | undefined) ?? "MEDIUM";
  const syncToGoogle = args.syncToGoogle !== false;

  if (!title || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error("title, startTime, and endTime are required");
  }

  if (endTime <= startTime) {
    throw new Error("End time must be after start time");
  }

  return {
    title,
    description,
    startTime,
    endTime,
    priority,
    syncToGoogle,
  };
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

async function handleDraftEvent(
  userId: string,
  args: Record<string, unknown>,
): Promise<CalendarToolResult> {
  const parsed = parseScheduleEventArgs(args);

  await validateAssistantScheduleInput(userId, {
    title: parsed.title,
    description: parsed.description,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    priority: parsed.priority,
  });

  const googleStatus = await getGoogleIntegrationStatus(userId);
  const syncToGoogle =
    parsed.syncToGoogle &&
    googleStatus.connected &&
    googleStatus.syncEnabled;

  const draft: AssistantScheduleDraft = {
    id: randomUUID(),
    title: parsed.title,
    description: parsed.description ?? null,
    startTime: parsed.startTime.toISOString(),
    endTime: parsed.endTime.toISOString(),
    priority: parsed.priority,
    syncToGoogle,
  };

  return {
    result: {
      status: "awaiting_user_confirmation",
      draft,
      instruction:
        "A confirmation card is shown in the chat. Tell the user what you drafted and ask them to review it and tap Confirm and Add. Do not say the event is already on their calendar.",
    },
    calendarUpdated: false,
    pendingDraft: draft,
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
- When the user wants something on their calendar, call draft_event with accurate ISO datetimes. Never claim an event was saved until the user confirms in the UI.
- After draft_event, summarize what you drafted and ask them to review the confirmation card and tap Confirm and Add. Example tone: "I've drafted that for you! Should I go ahead and add 'Call John' to your calendar for June 1st at 4:00 PM? Use the button below to confirm."
- You cannot write to the calendar directly — only draft_event, and the user must confirm.
- If Google Calendar is ${input.googleConnected ? "connected" : "not connected"}, ${
    input.googleConnected
      ? "drafts will offer Google sync when the user confirms"
      : "drafts will be CalTask-only until they connect Google in Settings"
  }.
- For vague requests ("block time tomorrow afternoon"), ask clarifying questions or propose a specific slot before calling draft_event.
- Never invent events that were not returned by get_schedule or confirmed by the user after a draft.
- If draft_event fails (e.g. conflict), explain the issue and suggest alternatives.`;
}
