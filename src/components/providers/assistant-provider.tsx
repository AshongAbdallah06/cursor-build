"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AssistantChatMessage } from "@/lib/ai/types";
import {
  loadAssistantChat,
  saveAssistantChat,
} from "@/lib/cache/assistant-chat-cache";
import { invalidateGoogleCalendarCache } from "@/lib/cache/google-calendar-cache";
import { invalidateTasksCache } from "@/lib/cache/dashboard-cache";
import { useTasks } from "@/components/providers/tasks-provider";
import { useUser } from "@/components/providers/user-provider";

export const ASSISTANT_WELCOME_MESSAGE: AssistantChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you plan your schedule, check availability, and add events to your calendar — including Google Calendar when it's connected. What would you like to plan?",
};

interface AssistantContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  messages: AssistantChatMessage[];
  input: string;
  setInput: (value: string) => void;
  sending: boolean;
  sendMessage: () => Promise<void>;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const { refreshTasks } = useTasks();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    ASSISTANT_WELCOME_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadAssistantChat(currentUser.id);
    if (stored?.length) {
      setMessages(stored);
    } else {
      setMessages([ASSISTANT_WELCOME_MESSAGE]);
    }
    setHydrated(true);
  }, [currentUser.id]);

  useEffect(() => {
    if (!hydrated) return;
    saveAssistantChat(currentUser.id, messages);
  }, [currentUser.id, messages, hydrated]);

  const handleCalendarUpdated = useCallback(() => {
    invalidateGoogleCalendarCache(currentUser.id);
    invalidateTasksCache(currentUser.id);
    void refreshTasks({ force: true });
  }, [currentUser.id, refreshTasks]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const attemptedMessage = trimmed;
    const nextMessages: AssistantChatMessage[] = [
      ...messages,
      { role: "user", content: attemptedMessage },
    ];

    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/calendar/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = (await response.json()) as {
        message?: string;
        calendarUpdated?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Assistant request failed");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.message ?? "Done." },
      ]);

      if (data.calendarUpdated) {
        handleCalendarUpdated();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Sorry, I couldn't complete that request.\n\n${errorMessage}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [handleCalendarUpdated, input, messages, sending]);

  const toggleOpen = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggleOpen,
      messages,
      input,
      setInput,
      sending,
      sendMessage,
    }),
    [
      open,
      messages,
      input,
      sending,
      sendMessage,
      toggleOpen,
    ],
  );

  return (
    <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
}
