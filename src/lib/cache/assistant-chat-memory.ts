import type { AssistantChatMessage } from "@/lib/ai/types";

const chatsByUserId = new Map<string, AssistantChatMessage[]>();

const LEGACY_STORAGE_PREFIX = "caltask-assistant-chat";

export function getAssistantChatMemory(
  userId: string,
): AssistantChatMessage[] | null {
  return chatsByUserId.get(userId) ?? null;
}

export function setAssistantChatMemory(
  userId: string,
  messages: AssistantChatMessage[],
) {
  chatsByUserId.set(userId, messages);
}

export function clearAssistantChatMemory(userId?: string) {
  if (userId) {
    chatsByUserId.delete(userId);
    return;
  }
  chatsByUserId.clear();
}

export function clearLegacyAssistantChatStorage() {
  if (typeof window === "undefined") return;

  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(LEGACY_STORAGE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  }
}
