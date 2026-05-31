"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { AssistantDraftCard } from "@/components/calendar/assistant-draft-card";
import { AssistantMessageContent } from "@/components/calendar/assistant-message-content";
import { useAssistant } from "@/components/providers/assistant-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function CalendarAssistantPanel() {
  const {
    messages,
    input,
    setInput,
    sending,
    confirmingDraftId,
    sendMessage,
    confirmDraft,
    dismissDraft,
  } = useAssistant();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const top = container.scrollHeight - container.clientHeight;
    if (top <= 0) return;

    if (behavior === "auto") {
      container.scrollTop = top;
      return;
    }

    container.scrollTo({ top, behavior });
  }, []);

  useLayoutEffect(() => {
    if (messages.length <= 1 && !sending) return;

    const frame = requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });

    return () => cancelAnimationFrame(frame);
  }, [messages, sending, scrollToBottom]);

  const handleSend = () => {
    void sendMessage();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [overflow-anchor:none] px-4 py-3"
      >
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
              {message.role === "assistant" ? (
                <>
                  <AssistantMessageContent content={message.content} />
                  {message.draft && message.draftStatus ? (
                    <AssistantDraftCard
                      draft={message.draft}
                      status={message.draftStatus}
                      confirming={confirmingDraftId === message.draft.id}
                      onConfirm={() => void confirmDraft(message.draft!.id)}
                      onDismiss={() => dismissDraft(message.draft!.id)}
                    />
                  ) : null}
                </>
              ) : (
                message.content
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Thinking…
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-2 border-t p-4">
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
          onClick={handleSend}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send
        </Button>
      </div>
    </div>
  );
}
