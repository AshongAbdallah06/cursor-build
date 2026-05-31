"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, User } from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { useTasks } from "@/components/providers/tasks-provider";
import { useUser } from "@/components/providers/user-provider";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from "@/lib/constants";
import {
  canManageTask,
  isIncomingRequest,
  isOutgoingRequest,
  isPersonalTask,
} from "@/lib/tasks/permissions";
import { isTaskScheduled } from "@/lib/tasks/validation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const ALL_STATUSES: TaskStatus[] = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
];

const ALL_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
}: TaskDetailDialogProps) {
  const { currentUser } = useUser();
  const { updateTask, deleteTask } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    priority: "MEDIUM" as TaskPriority,
    status: "PENDING" as TaskStatus,
  });

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description ?? "",
      date: task.startTime ? format(task.startTime, "yyyy-MM-dd") : "",
      startTime: task.startTime ? format(task.startTime, "HH:mm") : "",
      endTime: task.endTime ? format(task.endTime, "HH:mm") : "",
      priority: task.priority,
      status: task.status,
    });
    setIsEditing(false);
  }, [task, open]);

  if (!task) return null;

  const canManage = canManageTask(currentUser.id, task);
  const statusColors = TASK_STATUS_COLORS[task.status];

  const handleStatusChange = (status: TaskStatus) => {
    if (!canManage) return;
    setForm((prev) => ({ ...prev, status }));
    updateTask(task.id, { status });
  };

  const handleSave = () => {
    if (!isTaskScheduled(task) && isEditing) {
      updateTask(task.id, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        status: form.status,
      });
      setIsEditing(false);
      return;
    }

    const startTime = combineDateAndTime(form.date, form.startTime);
    const endTime = combineDateAndTime(form.date, form.endTime);

    if (endTime <= startTime) {
      window.alert("End time must be after start time.");
      return;
    }

    updateTask(task.id, {
      title: form.title.trim(),
      description: form.description.trim() || null,
      startTime,
      endTime,
      priority: form.priority,
      status: form.status,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete "${task.title}"? This action cannot be undone.`,
      )
    ) {
      deleteTask(task.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle>{isEditing ? "Edit task" : task.title}</DialogTitle>
              <DialogDescription>
                {isTaskScheduled(task) && task.startTime && task.endTime
                  ? `${format(task.startTime, "EEEE, MMMM d, yyyy · h:mm a")} – ${format(task.endTime, "h:mm a")}`
                  : "No schedule set"}
              </DialogDescription>
            </div>
            {!isEditing && (
              <Badge
                variant="outline"
                className={`shrink-0 ${statusColors.bg} ${statusColors.text} border-0`}
              >
                {TASK_STATUS_LABELS[task.status]}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="min-w-0 space-y-4 overflow-hidden">
          {canManage ? (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  handleStatusChange(value as TaskStatus)
                }
                disabled={isEditing}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Priority: {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>
              <Badge
                variant="outline"
                className={`${statusColors.bg} ${statusColors.text} border-0`}
              >
                {TASK_STATUS_LABELS[task.status]}
              </Badge>
            </div>
          )}

          <Separator />

          {isEditing ? (
            isTaskScheduled(task) ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: value as TaskPriority,
                    }))
                  }
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {TASK_PRIORITY_LABELS[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: value as TaskPriority,
                    }))
                  }
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {TASK_PRIORITY_LABELS[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            )
          ) : (
            <div className="min-w-0 space-y-3 text-sm">
              {task.description && (
                <p className="break-words whitespace-pre-wrap text-muted-foreground [overflow-wrap:anywhere]">
                  {task.description}
                </p>
              )}
              {isIncomingRequest(currentUser.id, task) && task.createdBy && (
                <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <User className="size-4 shrink-0" />
                  <span className="min-w-0 break-words">
                    Requested by {task.createdBy.fullName}
                  </span>
                </div>
              )}
              {isOutgoingRequest(currentUser.id, task) && task.assignedTo && (
                <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <User className="size-4 shrink-0" />
                  <span className="min-w-0 break-words">
                    Assigned to {task.assignedTo.fullName}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {TASK_PRIORITY_LABELS[task.priority]} priority
                </Badge>
                {isPersonalTask(currentUser.id, task) && (
                  <Badge variant="outline">Personal</Badge>
                )}
                {isIncomingRequest(currentUser.id, task) && (
                  <Badge variant="outline">Incoming request</Badge>
                )}
                {isOutgoingRequest(currentUser.id, task) && (
                  <Badge variant="outline">Outgoing request</Badge>
                )}
                {!isTaskScheduled(task) && (
                  <Badge variant="outline">Unscheduled</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {canManage && !isEditing && (
            <Button variant="destructive" className="shrink-0" onClick={handleDelete}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
          <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-2">
            {canManage && isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save changes</Button>
              </>
            ) : canManage ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="size-4" />
                Edit details
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
