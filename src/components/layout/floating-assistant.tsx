"use client";

import { Bot, Sparkles, X } from "lucide-react";
import { CalendarAssistantPanel } from "@/components/calendar/calendar-assistant-panel";
import { useAssistant } from "@/components/providers/assistant-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FloatingAssistant() {
  const { open, setOpen, toggleOpen } = useAssistant();

  return (
    <div className="pointer-events-none fixed top-3 right-4 z-[100] flex flex-col items-end md:top-4 md:right-6">
      <Button
        type="button"
        size="icon-lg"
        aria-expanded={open}
        aria-controls="calendar-assistant-panel"
        aria-label={open ? "Close calendar assistant" : "Open calendar assistant"}
        onClick={toggleOpen}
        className={cn(
          "pointer-events-auto size-12 rounded-full shadow-lg transition-transform duration-200 hover:scale-105",
          open && "ring-2 ring-primary/30",
        )}
      >
        {open ? <X className="size-5" /> : <Bot className="size-5" />}
      </Button>

      <div
        id="calendar-assistant-panel"
        aria-hidden={!open}
        className={cn(
          "assistant-panel pointer-events-auto mt-3 w-[min(380px,calc(100vw-2rem))]",
          open ? "assistant-panel-open" : "assistant-panel-closed",
        )}
      >
        <div className="assistant-panel-inner overflow-hidden rounded-xl border bg-card shadow-xl">
          <div className="assistant-panel-header flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Calendar assistant</p>
              <p className="truncate text-xs text-muted-foreground">
                Plan with Gemini
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close assistant panel"
              className="shrink-0"
            >
              <X className="size-4" />
            </Button>
          </div>

          <CalendarAssistantPanel />
        </div>
      </div>
    </div>
  );
}
