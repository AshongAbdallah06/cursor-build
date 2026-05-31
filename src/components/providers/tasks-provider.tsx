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
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { useUser } from "@/components/providers/user-provider";
import {
  getCachedTasks,
  invalidateTasksCache,
  isTasksFresh,
  setCachedTasks,
} from "@/lib/cache/dashboard-cache";
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
  getCalendarTasks: (userId: string) => Task[];
  getIncomingTasks: (userId: string) => Task[];
  getOutgoingTasks: (userId: string) => Task[];
  getTaskById: (id: string) => Task | undefined;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const cachedEntry = getCachedTasks(currentUser.id);
  const [tasks, setTasks] = useState<Task[]>(() => cachedEntry?.data ?? []);
  const [loading, setLoading] = useState(() => !cachedEntry);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(Boolean(cachedEntry));
  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const refreshTasks = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;

      if (!force && isTasksFresh(currentUser.id)) {
        const entry = getCachedTasks(currentUser.id);
        if (entry) {
          setTasks(entry.data);
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }
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
          const parsed = data.tasks.map(parseTaskFromJson);
          setCachedTasks(currentUser.id, parsed);
          setTasks(parsed);
          hasLoadedRef.current = true;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load tasks");
          const entry = getCachedTasks(currentUser.id);
          if (entry) {
            setTasks(entry.data);
            hasLoadedRef.current = true;
          } else if (!hasLoadedRef.current) {
            setTasks([]);
          }
        } finally {
          setLoading(false);
          fetchInFlightRef.current = null;
        }
      })();

      fetchInFlightRef.current = fetchPromise;
      await fetchPromise;
    },
    [currentUser.id],
  );

  useEffect(() => {
    hasLoadedRef.current = Boolean(getCachedTasks(currentUser.id));
    void refreshTasks({ force: !isTasksFresh(currentUser.id) });
  }, [currentUser.id, refreshTasks]);

  useEffect(() => {
    const handleRefresh = () => void refreshTasks();

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleRefresh();
      }
    });

    return () => {
      window.removeEventListener("focus", handleRefresh);
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
        setTasks((current) => {
          const next = current.map((task) => (task.id === id ? saved : task));
          setCachedTasks(currentUser.id, next);
          return next;
        });
      } catch {
        setTasks(previous);
        setError("Failed to save task changes");
      }
    },
    [currentUser.id, tasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const previous = tasks;
      setTasks((current) => {
        const next = current.filter((task) => task.id !== id);
        setCachedTasks(currentUser.id, next);
        return next;
      });

      try {
        const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to delete task");
        }
      } catch {
        setTasks(previous);
        setCachedTasks(currentUser.id, previous);
        setError("Failed to delete task");
      }
    },
    [currentUser.id, tasks],
  );

  const getCalendarTasks = useCallback(
    (userId: string) =>
      tasks.filter(
        (task) =>
          (task.createdById === userId || task.assignedToId === userId) &&
          task.startTime &&
          task.endTime,
      ),
    [tasks],
  );

  const getIncomingTasks = useCallback(
    (userId: string) =>
      tasks.filter(
        (task) => task.assignedToId === userId && task.createdById !== userId,
      ),
    [tasks],
  );

  const getOutgoingTasks = useCallback(
    (userId: string) =>
      tasks.filter(
        (task) => task.createdById === userId && task.assignedToId !== userId,
      ),
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
      getCalendarTasks,
      getIncomingTasks,
      getOutgoingTasks,
      getTaskById,
    }),
    [
      tasks,
      loading,
      error,
      refreshTasks,
      updateTask,
      deleteTask,
      getCalendarTasks,
      getIncomingTasks,
      getOutgoingTasks,
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
