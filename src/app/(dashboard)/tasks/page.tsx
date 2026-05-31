"use client";

import { useTasks } from "@/components/providers/tasks-provider";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { Loader2 } from "lucide-react";

export default function TasksPage() {
  const { loading, error } = useTasks();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground">
          Manage items on your calendar and track requests you&apos;ve sent.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading tasks…
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}

      {!loading && <KanbanBoard />}
    </div>
  );
}
