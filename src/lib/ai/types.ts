export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantChatResponse {
  message: string;
  calendarUpdated: boolean;
}

export interface ScheduleEventResult {
  task: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  googleEvent: {
    id: string;
    title: string;
    htmlLink: string | null;
  } | null;
  googleSyncError: string | null;
}
