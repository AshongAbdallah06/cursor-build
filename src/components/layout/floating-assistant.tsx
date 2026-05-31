"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Bot, Sparkles, X } from "lucide-react";
import { CalendarAssistantPanel } from "@/components/calendar/calendar-assistant-panel";
import { useAssistant } from "@/components/providers/assistant-provider";
import { Button } from "@/components/ui/button";
import {
  clampAssistantPosition,
  getDefaultAssistantPosition,
  loadAssistantPosition,
  saveAssistantPosition,
  type AssistantPosition,
} from "@/lib/cache/assistant-position-cache";
import {
  resolveAssistantLayout,
  type AssistantPanelPlacement,
} from "@/lib/assistant-panel-placement";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 6;
const FAB_SIZE_PX = 48;

const DEFAULT_PLACEMENT: AssistantPanelPlacement = {
  vertical: "below",
  horizontal: "end",
  maxPanelHeight: 560,
};

interface DragState {
  active: boolean;
  moved: boolean;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export function FloatingAssistant() {
  const { open, setOpen, toggleOpen } = useAssistant();
  const [position, setPosition] = useState<AssistantPosition | null>(null);
  const [placement, setPlacement] =
    useState<AssistantPanelPlacement>(DEFAULT_PLACEMENT);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragState>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const syncLayout = useCallback((x: number, y: number, isOpen: boolean) => {
    return resolveAssistantLayout(x, y, isOpen);
  }, []);

  const clampClosedPosition = useCallback((nextX: number, nextY: number) => {
    return clampAssistantPosition(nextX, nextY, FAB_SIZE_PX, FAB_SIZE_PX);
  }, []);

  useLayoutEffect(() => {
    const saved = loadAssistantPosition();
    const initial = saved ?? getDefaultAssistantPosition(FAB_SIZE_PX, FAB_SIZE_PX);
    const clamped = clampClosedPosition(initial.x, initial.y);
    const layout = syncLayout(clamped.x, clamped.y, false);
    setPosition(layout.position);
    setPlacement(layout.placement);
  }, [clampClosedPosition, syncLayout]);

  useLayoutEffect(() => {
    if (!position) return;

    const layout = syncLayout(position.x, position.y, open);
    setPlacement(layout.placement);

    if (
      layout.position.x !== position.x ||
      layout.position.y !== position.y
    ) {
      setPosition(layout.position);
    }
  }, [open, position, syncLayout]);

  useEffect(() => {
    if (!position) return;
    saveAssistantPosition(position);
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => {
        if (!current) return current;
        const layout = syncLayout(current.x, current.y, open);
        setPlacement(layout.placement);
        return layout.position;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, syncLayout]);

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (position === null || event.button !== 0) return;

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current.active || position === null) return;

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    if (
      !dragRef.current.moved &&
      (Math.abs(deltaX) > DRAG_THRESHOLD_PX ||
        Math.abs(deltaY) > DRAG_THRESHOLD_PX)
    ) {
      dragRef.current.moved = true;
    }

    if (!dragRef.current.moved) return;

    event.preventDefault();

    const rawX = dragRef.current.originX + deltaX;
    const rawY = dragRef.current.originY + deltaY;

    if (open) {
      const layout = syncLayout(rawX, rawY, true);
      setPlacement(layout.placement);
      setPosition(layout.position);
      return;
    }

    setPosition(clampClosedPosition(rawX, rawY));
  };

  const endDrag = (
    event: ReactPointerEvent<HTMLElement>,
    toggleOnTap: boolean,
  ) => {
    if (!dragRef.current.active) return;

    const didMove = dragRef.current.moved;
    dragRef.current.active = false;
    dragRef.current.moved = false;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!didMove && toggleOnTap) {
      toggleOpen();
    }
  };

  const createDragHandleProps = (toggleOnTap: boolean) => ({
    onPointerDown: beginDrag,
    onPointerMove: moveDrag,
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) =>
      endDrag(event, toggleOnTap),
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) =>
      endDrag(event, false),
    onClick: (event: React.MouseEvent) => {
      if (dragRef.current.moved) {
        event.preventDefault();
      }
    },
  });

  const fabDragProps = createDragHandleProps(true);
  const headerDragProps = createDragHandleProps(false);

  const panelStyle = open
    ? ({
        "--assistant-panel-max-height": `${placement.maxPanelHeight}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      style={
        position
          ? { left: position.x, top: position.y }
          : undefined
      }
      className={cn(
        "pointer-events-none fixed z-[100]",
        position === null && "top-3 right-4 md:top-4 md:right-6",
      )}
    >
      <div className="relative inline-flex">
        <Button
          type="button"
          size="icon-lg"
          aria-expanded={open}
          aria-controls="calendar-assistant-panel"
          aria-label={
            open
              ? "Close calendar assistant. Drag to reposition."
              : "Open calendar assistant. Drag to reposition."
          }
          title="Drag to move · Click to open"
          {...fabDragProps}
          className={cn(
            "pointer-events-auto size-12 touch-none rounded-full shadow-lg transition-shadow duration-200 select-none hover:scale-105",
            dragging ? "cursor-grabbing scale-105" : "cursor-grab",
            open && "ring-2 ring-primary/30",
          )}
        >
          {open ? <X className="size-5" /> : <Bot className="size-5" />}
        </Button>

        {open ? (
          <div
            id="calendar-assistant-panel"
            data-vertical={placement.vertical}
            data-horizontal={placement.horizontal}
            style={panelStyle}
            className={cn(
              "assistant-panel assistant-panel-open pointer-events-auto absolute w-[min(380px,calc(100vw-2rem))]",
              placement.vertical === "below"
                ? "top-[calc(100%+0.75rem)]"
                : "bottom-[calc(100%+0.75rem)]",
              placement.horizontal === "end" ? "right-0" : "left-0",
            )}
          >
            <div
              className="assistant-panel-inner flex max-h-[var(--assistant-panel-max-height)] flex-col overflow-hidden rounded-xl border bg-card shadow-xl"
            >
              <div
                {...headerDragProps}
                title="Drag to move"
                className={cn(
                  "assistant-panel-header flex shrink-0 touch-none items-center gap-2 border-b bg-muted/30 px-4 py-2.5 select-none",
                  dragging ? "cursor-grabbing" : "cursor-grab",
                )}
              >
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    Calendar assistant
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Plan with Gemini · drag to move
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant panel"
                  className="shrink-0 cursor-pointer"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <CalendarAssistantPanel />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
