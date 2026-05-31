"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import type { Task, TaskStatus } from "@/types";
import { useTasks } from "@/components/providers/tasks-provider";
import { useUser } from "@/components/providers/user-provider";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const KANBAN_COLUMNS: TaskStatus[] = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
];

function isKanbanColumn(id: string | number): id is TaskStatus {
  return KANBAN_COLUMNS.includes(id as TaskStatus);
}

function KanbanCardContent({
  task,
  showClient = false,
}: {
  task: Task;
  showClient?: boolean;
}) {
  return (
    <>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-medium leading-snug">
          {task.title}
        </CardTitle>
        <CardDescription className="text-xs">
          {format(task.startTime, "MMM d · h:mm a")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1 p-3 pt-0">
        <Badge variant="outline" className="text-[10px]">
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
        {showClient && task.createdBy && task.createdBy.role === "CLIENT" && (
          <Badge variant="secondary" className="text-[10px]">
            {task.createdBy.fullName}
          </Badge>
        )}
      </CardContent>
    </>
  );
}

function StaticKanbanCard({ task, showClient }: { task: Task; showClient?: boolean }) {
  return (
    <Card className="shadow-none">
      <KanbanCardContent task={task} showClient={showClient} />
    </Card>
  );
}

function DraggableKanbanCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab touch-none shadow-none transition-shadow active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...listeners}
      {...attributes}
    >
      <KanbanCardContent task={task} showClient />
    </Card>
  );
}

function KanbanColumn({
  status,
  tasks,
  interactive = false,
}: {
  status: TaskStatus;
  tasks: Task[];
  interactive?: boolean;
}) {
  const colors = TASK_STATUS_COLORS[status];
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    disabled: !interactive,
  });

  return (
    <Card
      className={cn(
        "flex flex-col transition-colors",
        interactive && isOver && "ring-2 ring-primary/30",
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{TASK_STATUS_LABELS[status]}</span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </CardTitle>
        <div className={cn("h-1 rounded-full", colors.bg)} />
      </CardHeader>
      <CardContent
        ref={interactive ? setNodeRef : undefined}
        className={cn(
          "flex min-h-[220px] flex-1 flex-col gap-2 rounded-lg transition-colors",
          interactive && isOver && "bg-muted/40",
        )}
      >
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {interactive ? "Drop tasks here" : "No tasks"}
          </p>
        ) : (
          tasks.map((task) =>
            interactive ? (
              <DraggableKanbanCard key={task.id} task={task} />
            ) : (
              <StaticKanbanCard key={task.id} task={task} showClient />
            ),
          )
        )}
      </CardContent>
    </Card>
  );
}

export function KanbanBoard() {
  const { currentUser, isProvider } = useUser();
  const { getTasksForUser, updateTask } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const tasks = getTasksForUser(currentUser.id, currentUser.role);

  const tasksByStatus = useMemo(
    () =>
      KANBAN_COLUMNS.reduce(
        (acc, status) => {
          acc[status] = tasks.filter((task) => task.status === status);
          return acc;
        },
        {} as Record<TaskStatus, Task[]>,
      ),
    [tasks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const newStatus = over.id;

    if (!isKanbanColumn(newStatus)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    void updateTask(taskId, { status: newStatus });
  };

  if (!isProvider) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn key={status} status={status} tasks={tasksByStatus[status]} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            interactive
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <Card className="cursor-grabbing rotate-1 shadow-lg ring-2 ring-primary/20">
            <KanbanCardContent task={activeTask} showClient />
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
