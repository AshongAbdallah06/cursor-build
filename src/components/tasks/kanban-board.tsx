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
import { isIncomingRequest } from "@/lib/tasks/permissions";
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
  showRequester = false,
}: {
  task: Task;
  showRequester?: boolean;
}) {
  return (
    <>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-medium leading-snug">
          {task.title}
        </CardTitle>
        <CardDescription className="text-xs">
          {task.startTime && task.endTime
            ? format(task.startTime, "MMM d · h:mm a")
            : "No schedule set"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1 p-3 pt-0">
        <Badge variant="outline" className="text-[10px]">
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
        {showRequester && task.createdBy && (
          <Badge variant="secondary" className="text-[10px]">
            {task.createdBy.fullName}
          </Badge>
        )}
      </CardContent>
    </>
  );
}

function StaticKanbanCard({
  task,
  showRequester,
}: {
  task: Task;
  showRequester?: boolean;
}) {
  return (
    <Card className="shadow-none">
      <KanbanCardContent task={task} showRequester={showRequester} />
    </Card>
  );
}

function DraggableKanbanCard({
  task,
  userId,
}: {
  task: Task;
  userId: string;
}) {
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
      <KanbanCardContent
        task={task}
        showRequester={isIncomingRequest(userId, task)}
      />
    </Card>
  );
}

function KanbanColumn({
  status,
  tasks,
  interactive = false,
  showRequester = false,
  userId,
}: {
  status: TaskStatus;
  tasks: Task[];
  interactive?: boolean;
  showRequester?: boolean;
  userId?: string;
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
              <DraggableKanbanCard key={task.id} task={task} userId={userId ?? ""} />
            ) : (
              <StaticKanbanCard
                key={task.id}
                task={task}
                showRequester={showRequester}
              />
            ),
          )
        )}
      </CardContent>
    </Card>
  );
}

function KanbanGrid({
  tasks,
  interactive,
  showRequester,
  userId,
}: {
  tasks: Task[];
  interactive: boolean;
  showRequester?: boolean;
  userId?: string;
}) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {KANBAN_COLUMNS.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasksByStatus[status]}
          interactive={interactive}
          showRequester={showRequester}
          userId={userId}
        />
      ))}
    </div>
  );
}

function InteractiveKanbanBoard({
  tasks,
  userId,
}: {
  tasks: Task[];
  userId: string;
}) {
  const { updateTask } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <KanbanGrid tasks={tasks} interactive userId={userId} />
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <Card className="cursor-grabbing rotate-1 shadow-lg ring-2 ring-primary/20">
            <KanbanCardContent
              task={activeTask}
              showRequester={isIncomingRequest(userId, activeTask)}
            />
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function KanbanBoard() {
  const { currentUser } = useUser();
  const { tasks, getOutgoingTasks } = useTasks();

  const manageableTasks = useMemo(
    () => tasks.filter((task) => task.assignedToId === currentUser.id),
    [tasks, currentUser.id],
  );

  const outgoingTasks = useMemo(
    () => getOutgoingTasks(currentUser.id),
    [getOutgoingTasks, currentUser.id],
  );

  if (manageableTasks.length === 0 && outgoingTasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No tasks yet. Share your request link or use the AI assistant to add
        items to your calendar.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {manageableTasks.length > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">On your calendar</h3>
            <p className="text-sm text-muted-foreground">
              Drag tasks between columns to update their status.
            </p>
          </div>
          <InteractiveKanbanBoard tasks={manageableTasks} userId={currentUser.id} />
        </section>
      )}

      {outgoingTasks.length > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Requests you sent</h3>
            <p className="text-sm text-muted-foreground">
              Track requests waiting on someone else&apos;s calendar.
            </p>
          </div>
          <KanbanGrid tasks={outgoingTasks} interactive={false} showRequester />
        </section>
      )}
    </div>
  );
}
