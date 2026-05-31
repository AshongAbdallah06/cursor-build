import type { AssistantChatMessage } from "@/lib/ai/types";

const STORAGE_PREFIX = "caltask-assistant-chat";

export function getAssistantChatStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadAssistantChat(userId: string): AssistantChatMessage[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(getAssistantChatStorageKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AssistantChatMessage[];
    if (!Array.isArray(parsed)) return null;

    return parsed.filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    );
  } catch {
    return null;
  }
}

export function saveAssistantChat(
  userId: string,
  messages: AssistantChatMessage[],
) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      getAssistantChatStorageKey(userId),
      JSON.stringify(messages),
    );
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearAssistantChat(userId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(getAssistantChatStorageKey(userId));
}
