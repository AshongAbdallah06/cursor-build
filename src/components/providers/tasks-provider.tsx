"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { BusySlot, Task, TaskPriority, TaskStatus, UserRole } from "@/types";
import { useUser } from "@/components/providers/user-provider";
import { TASKS_STALE_MS } from "@/lib/cache/client-cache";
import { parseTaskFromJson } from "@/lib/tasks/serialize";

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  startTime?: Date;
  endTime?: Date;
  status?: TaskStatus;
  priority?: TaskPriority;
}

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refreshTasks: (options?: { force?: boolean }) => Promise<void>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTasksForUser: (userId: string, role: UserRole) => Task[];
  getBusySlotsForClient: (clientId: string) => BusySlot[];
  getTaskById: (id: string) => Task | undefined;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAtRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const refreshTasks = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    const isFresh =
      hasLoadedRef.current &&
      Date.now() - lastFetchedAtRef.current < TASKS_STALE_MS;

    if (!force && isFresh) {
      return;
    }

    if (fetchInFlightRef.current) {
      await fetchInFlightRef.current;
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    setError(null);

    const fetchPromise = (async () => {
      try {
        const response = await fetch("/api/tasks", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load tasks from database");
        }

        const data = (await response.json()) as { tasks: Task[] };
        setTasks(data.tasks.map(parseTaskFromJson));
        lastFetchedAtRef.current = Date.now();
        hasLoadedRef.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
        if (!hasLoadedRef.current) {
          setTasks([]);
        }
      } finally {
        setLoading(false);
        fetchInFlightRef.current = null;
      }
    })();

    fetchInFlightRef.current = fetchPromise;
    await fetchPromise;
  }, []);

  useEffect(() => {
    hasLoadedRef.current = false;
    lastFetchedAtRef.current = 0;
    void refreshTasks({ force: true });
  }, [currentUser.id, refreshTasks]);

  useEffect(() => {
    const handleRefresh = () => void refreshTasks();
    const handlePoll = () => void refreshTasks({ force: true });

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleRefresh();
      }
    });

    const interval = window.setInterval(handlePoll, 30_000);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.clearInterval(interval);
    };
  }, [refreshTasks]);

  const getTaskById = useCallback(
    (id: string) => tasks.find((task) => task.id === id),
    [tasks],
  );

  const updateTask = useCallback(
    async (id: string, updates: UpdateTaskInput) => {
      const previous = tasks;
      setTasks((current) =>
        current.map((task) =>
          task.id === id
            ? {
                ...task,
                ...updates,
                updatedAt: new Date(),
              }
            : task,
        ),
      );

      try {
        const payload = {
          ...updates,
          startTime: updates.startTime?.toISOString(),
          endTime: updates.endTime?.toISOString(),
        };

        const response = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to save task");
        }

        const data = (await response.json()) as { task: Task };
        const saved = parseTaskFromJson(data.task);
        setTasks((current) =>
          current.map((task) => (task.id === id ? saved : task)),
        );
        lastFetchedAtRef.current = Date.now();
      } catch {
        setTasks(previous);
        setError("Failed to save task changes");
      }
    },
    [tasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const previous = tasks;
      setTasks((current) => current.filter((task) => task.id !== id));

      try {
        const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to delete task");
        }
      } catch {
        setTasks(previous);
        setError("Failed to delete task");
      }
    },
    [tasks],
  );

  const getTasksForUser = useCallback(
    (userId: string, role: UserRole) => {
      if (role === "PROVIDER") {
        return tasks;
      }
      return tasks.filter((task) => task.createdById === userId);
    },
    [tasks],
  );

  const getBusySlotsForClient = useCallback(
    (clientId: string): BusySlot[] => {
      return tasks
        .filter((task) => task.createdById !== clientId)
        .map((task) => ({
          id: `busy-${task.id}`,
          startTime: task.startTime,
          endTime: task.endTime,
        }));
    },
    [tasks],
  );

  const value = useMemo(
    () => ({
      tasks,
      loading,
      error,
      refreshTasks,
      updateTask,
      deleteTask,
      getTasksForUser,
      getBusySlotsForClient,
      getTaskById,
    }),
    [
      tasks,
      loading,
      error,
      refreshTasks,
      updateTask,
      deleteTask,
      getTasksForUser,
      getBusySlotsForClient,
      getTaskById,
    ],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
