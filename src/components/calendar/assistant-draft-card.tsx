"use client";

import { format } from "date-fns";
import { CalendarPlus, Check, Loader2, X } from "lucide-react";
import type { AssistantScheduleDraft } from "@/lib/ai/types";
import { TASK_PRIORITY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AssistantDraftCardProps {
  draft: AssistantScheduleDraft;
  status: "pending" | "confirmed" | "dismissed";
  confirming?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function AssistantDraftCard({
  draft,
  status,
  confirming = false,
  onConfirm,
  onDismiss,
}: AssistantDraftCardProps) {
  const start = new Date(draft.startTime);
  const end = new Date(draft.endTime);
  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");

  const whenLabel = sameDay
    ? `${format(start, "EEEE, MMMM d, yyyy · h:mm a")} – ${format(end, "h:mm a")}`
    : `${format(start, "MMM d, yyyy · h:mm a")} – ${format(end, "MMM d, yyyy · h:mm a")}`;

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border bg-background/80 p-3 shadow-sm",
        status === "confirmed" && "border-emerald-500/40 bg-emerald-500/5",
        status === "dismissed" && "opacity-70",
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarPlus className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {status === "confirmed"
              ? "Added to calendar"
              : status === "dismissed"
                ? "Draft dismissed"
                : "Review draft"}
          </p>
          <p className="truncate text-sm font-semibold">{draft.title}</p>
        </div>
      </div>

      <dl className="space-y-1.5 text-xs text-muted-foreground">
        <div>
          <dt className="sr-only">When</dt>
          <dd>{whenLabel}</dd>
        </div>
        {draft.description ? (
          <div>
            <dt className="sr-only">Details</dt>
            <dd className="text-foreground/80">{draft.description}</dd>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>Priority: {TASK_PRIORITY_LABELS[draft.priority]}</span>
          <span>
            {draft.syncToGoogle
              ? "Will sync to Google Calendar"
              : "CalTask calendar only"}
          </span>
        </div>
      </dl>

      {status === "pending" ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="sm"
            className="flex-1"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Confirm and Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={confirming}
            onClick={onDismiss}
          >
            <X className="size-4" />
            Cancel
          </Button>
        </div>
      ) : null}

      {status === "confirmed" ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-3.5" />
          Saved to your calendar
        </p>
      ) : null}
    </div>
  );
}
