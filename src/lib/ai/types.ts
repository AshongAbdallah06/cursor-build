import type { TaskPriority } from "@/types";

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
  draft?: AssistantScheduleDraft;
  draftStatus?: "pending" | "confirmed" | "dismissed";
}

export interface AssistantChatResponse {
  message: string;
  calendarUpdated: boolean;
  pendingDraft?: AssistantScheduleDraft;
}

export interface AssistantScheduleDraft {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  syncToGoogle: boolean;
}

export interface ScheduleEventResult {
  task: {
    id: string;
    title: string;
    startTime: string | null;
    endTime: string | null;
    status: string;
  };
  googleEvent: {
    id: string;
    title: string;
    htmlLink: string | null;
  } | null;
  googleSyncError: string | null;
}

export function stripAssistantMessageForApi(
  message: AssistantChatMessage,
): Pick<AssistantChatMessage, "role" | "content"> {
  return { role: message.role, content: message.content };
}
