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
import type {
  AssistantChatMessage,
  AssistantScheduleDraft,
} from "@/lib/ai/types";
import { stripAssistantMessageForApi } from "@/lib/ai/types";
import {
  clearLegacyAssistantChatStorage,
  getAssistantChatMemory,
  setAssistantChatMemory,
} from "@/lib/cache/assistant-chat-memory";
import { invalidateGoogleCalendarCache } from "@/lib/cache/google-calendar-cache";
import { invalidateTasksCache } from "@/lib/cache/dashboard-cache";
import { useTasks } from "@/components/providers/tasks-provider";
import { useUser } from "@/components/providers/user-provider";

export const ASSISTANT_WELCOME_MESSAGE: AssistantChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you plan your schedule and check availability. When you're ready to add something, I'll draft it first and ask you to confirm before it goes on your calendar. What would you like to plan?",
};

function getInitialMessages(userId: string) {
  return getAssistantChatMemory(userId) ?? [ASSISTANT_WELCOME_MESSAGE];
}

interface AssistantContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  messages: AssistantChatMessage[];
  input: string;
  setInput: (value: string) => void;
  sending: boolean;
  confirmingDraftId: string | null;
  sendMessage: () => Promise<void>;
  confirmDraft: (draftId: string) => Promise<void>;
  dismissDraft: (draftId: string) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const { refreshTasks } = useTasks();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() =>
    getInitialMessages(currentUser.id),
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmingDraftId, setConfirmingDraftId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    clearLegacyAssistantChatStorage();
  }, []);

  useEffect(() => {
    setMessages(getInitialMessages(currentUser.id));
    setInput("");
    setOpen(false);
    setConfirmingDraftId(null);
  }, [currentUser.id]);

  useEffect(() => {
    setAssistantChatMemory(currentUser.id, messages);
  }, [currentUser.id, messages]);

  useEffect(() => {
    if (!open) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [open]);

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
        body: JSON.stringify({
          messages: nextMessages.map(stripAssistantMessageForApi),
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        calendarUpdated?: boolean;
        pendingDraft?: AssistantScheduleDraft;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Assistant request failed");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message ?? "Done.",
          draft: data.pendingDraft,
          draftStatus: data.pendingDraft ? "pending" : undefined,
        },
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

  const confirmDraft = useCallback(
    async (draftId: string) => {
      const message = messages.find(
        (entry) => entry.draft?.id === draftId && entry.draftStatus === "pending",
      );
      if (!message?.draft || confirmingDraftId) return;

      setConfirmingDraftId(draftId);

      try {
        const response = await fetch("/api/calendar/assistant/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: message.draft }),
        });

        const data = (await response.json()) as {
          calendarUpdated?: boolean;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Could not add that event");
        }

        setMessages((current) =>
          current.map((entry) =>
            entry.draft?.id === draftId
              ? { ...entry, draftStatus: "confirmed" as const }
              : entry,
          ),
        );

        if (data.calendarUpdated) {
          handleCalendarUpdated();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Could not add that event";

        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: `Sorry, I couldn't add that to your calendar.\n\n${errorMessage}`,
          },
        ]);
      } finally {
        setConfirmingDraftId(null);
      }
    },
    [confirmingDraftId, handleCalendarUpdated, messages],
  );

  const dismissDraft = useCallback((draftId: string) => {
    setMessages((current) =>
      current.map((entry) =>
        entry.draft?.id === draftId
          ? { ...entry, draftStatus: "dismissed" as const }
          : entry,
      ),
    );
  }, []);

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
      confirmingDraftId,
      sendMessage,
      confirmDraft,
      dismissDraft,
    }),
    [
      open,
      messages,
      input,
      sending,
      confirmingDraftId,
      sendMessage,
      confirmDraft,
      dismissDraft,
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
