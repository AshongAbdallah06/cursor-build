"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import type { AssistantChatMessage } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const WELCOME_MESSAGE: AssistantChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you plan your schedule, check availability, and add events to your calendar — including Google Calendar when it's connected. What would you like to plan?",
};

interface CalendarAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  onCalendarUpdated?: () => void;
}

export function CalendarAssistantPanel({
  open,
  onClose,
  onCalendarUpdated,
}: CalendarAssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const nextMessages: AssistantChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);

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
        onCalendarUpdated?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (!open) return null;

  return (
    <aside className="flex h-[min(420px,55vh)] w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm xl:h-[min(780px,calc(100vh-12rem))]">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">Calendar assistant</h3>
              <Sparkles className="size-3.5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">
              Plan with Gemini and update your calendar
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close assistant"
        >
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-3">
        <div className="space-y-3 pr-2">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {message.content}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Thinking…
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t p-4">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            {error}
          </p>
        )}

        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me to plan your week, block focus time, or check availability…"
          rows={3}
          disabled={sending}
        />

        <Button
          type="button"
          className="w-full"
          disabled={sending || !input.trim()}
          onClick={() => void handleSend()}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send
        </Button>
      </div>
    </aside>
  );
}

export function CalendarAssistantToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant={open ? "default" : "outline"}
      onClick={onToggle}
      className="gap-2"
    >
      <Bot className="size-4" />
      {open ? "Hide assistant" : "AI assistant"}
    </Button>
  );
}
