"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import type { Task, TaskPriority } from "@/types";
import { TASK_PRIORITY_LABELS } from "@/lib/constants";
import { combineDateAndTime } from "@/lib/tasks/validation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

interface TaskRequestFormProps {
  provider: { id: string; fullName: string };
  onSuccess: (task: Task) => void;
}

export function TaskRequestForm({ provider, onSuccess }: TaskRequestFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    sameDay: false,
    priority: "MEDIUM" as TaskPriority,
  });

  const effectiveEndDate = form.sameDay ? form.startDate : form.endDate;

  const schedulePreview = useMemo(() => {
    if (!form.startDate || !form.startTime || !effectiveEndDate || !form.endTime) {
      return null;
    }

    try {
      const start = combineDateAndTime(form.startDate, form.startTime);
      const end = combineDateAndTime(effectiveEndDate, form.endTime);
      if (end <= start) return null;
      return { start, end };
    } catch {
      return null;
    }
  }, [form.startDate, form.startTime, effectiveEndDate, form.endTime]);

  const handleSameDayChange = (sameDay: boolean) => {
    setForm((prev) => ({
      ...prev,
      sameDay,
      endDate: sameDay ? prev.startDate : prev.endDate,
    }));
  };

  const handleStartDateChange = (startDate: string) => {
    setForm((prev) => ({
      ...prev,
      startDate,
      endDate: prev.sameDay ? startDate : prev.endDate,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.startDate || !form.startTime || !form.endTime) {
      setError("Please fill in the start date, start time, and end time.");
      return;
    }

    if (!form.sameDay && !form.endDate) {
      setError("Please select a deadline date.");
      return;
    }

    const endDate = form.sameDay ? form.startDate : form.endDate;

    let start: Date;
    let end: Date;

    try {
      start = combineDateAndTime(form.startDate, form.startTime);
      end = combineDateAndTime(endDate, form.endTime);
    } catch {
      setError("Invalid date or time.");
      return;
    }

    if (end <= start) {
      setError(
        form.sameDay
          ? "End time must be after start time."
          : "Deadline must be after the start date and time.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/public/task-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          title: form.title,
          description: form.description,
          startDate: form.startDate,
          startTime: form.startTime,
          endDate,
          endTime: form.endTime,
          priority: form.priority,
        }),
      });

      const data = (await response.json()) as { task?: Task; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to submit request");
      }

      if (data.task) {
        onSuccess(data.task);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request time with {provider.fullName}</CardTitle>
        <CardDescription>
          Choose when the task starts and when it should be completed by. Your
          request will appear on their calendar as pending until they accept it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Your name</Label>
              <Input
                id="clientName"
                required
                value={form.clientName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, clientName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Your email</Label>
              <Input
                id="clientEmail"
                type="email"
                required
                value={form.clientEmail}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, clientEmail: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Task title</Label>
            <Input
              id="title"
              required
              placeholder="What do you need help with?"
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
              rows={3}
              placeholder="Add details about the task..."
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Schedule</p>
              <p className="text-xs text-muted-foreground">
                Set a start date and a deadline. Use same day when everything
                happens in one day.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start time</Label>
                <Input
                  id="startTime"
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>
            </div>

            <button
              type="button"
              role="checkbox"
              aria-checked={form.sameDay}
              onClick={() => handleSameDayChange(!form.sameDay)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                form.sameDay
                  ? "border-primary/40 bg-primary/5"
                  : "hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded border",
                  form.sameDay
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-background",
                )}
              >
                {form.sameDay ? <Check className="size-3.5" /> : null}
              </span>
              <span>
                <span className="font-medium">Same day</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Deadline is on the start date — only pick an end time
                </span>
              </span>
            </button>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endDate">Deadline date</Label>
                <Input
                  id="endDate"
                  type="date"
                  required={!form.sameDay}
                  disabled={form.sameDay}
                  min={form.startDate || undefined}
                  value={effectiveEndDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className={form.sameDay ? "opacity-60" : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">
                  {form.sameDay ? "End time" : "Deadline time"}
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </div>
            </div>

            {schedulePreview && (
              <p className="text-xs text-muted-foreground">
                {form.sameDay
                  ? "Completing same day between start and end time."
                  : "Task spans multiple days from start to deadline."}
              </p>
            )}
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
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {TASK_PRIORITY_LABELS[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Submit request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
