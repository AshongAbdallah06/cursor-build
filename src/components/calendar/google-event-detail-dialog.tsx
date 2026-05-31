"use client";

import { format } from "date-fns";
import { CalendarClock, ExternalLink, MapPin } from "lucide-react";
import type { GoogleCalendarEvent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GoogleEventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: GoogleCalendarEvent | null;
}

export function GoogleEventDetailDialog({
  open,
  onOpenChange,
  event,
}: GoogleEventDetailDialogProps) {
  if (!event) return null;

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const isBusy = event.hideDetails;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle>
                {isBusy ? "Provider unavailable" : event.title}
              </DialogTitle>
              <DialogDescription>
                {event.allDay
                  ? format(startTime, "EEEE, MMMM d, yyyy · All day")
                  : `${format(startTime, "EEEE, MMMM d, yyyy · h:mm a")} – ${format(endTime, "h:mm a")}`}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="shrink-0">
              Google
            </Badge>
          </div>
        </DialogHeader>

        <div className="min-w-0 space-y-3 overflow-hidden text-sm">
          {isBusy ? (
            <p className="break-words text-muted-foreground [overflow-wrap:anywhere]">
              The provider has a Google Calendar commitment during this time.
              Event details are hidden for privacy.
            </p>
          ) : (
            <>
              {event.description && (
                <p className="break-words whitespace-pre-wrap text-muted-foreground [overflow-wrap:anywhere]">
                  {event.description}
                </p>
              )}
              {event.location && (
                <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                    {event.location}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 break-words">Synced from Google Calendar</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {!isBusy && event.htmlLink ? (
            <Button
              variant="outline"
              nativeButton={false}
              className="max-w-full shrink"
              render={
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 truncate"
                />
              }
            >
              <ExternalLink className="size-4 shrink-0" />
              <span className="truncate">Open in Google</span>
            </Button>
          ) : (
            <span className="hidden sm:inline" />
          )}
          <Button
            variant="secondary"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
