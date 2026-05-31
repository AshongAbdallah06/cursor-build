"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { mockClients, mockProvider, mockUsers } from "@/lib/mock-data";

interface UserContextValue {
  currentUser: User;
  users: User[];
  switchUser: (userId: string) => void;
  isProvider: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

async function syncSessionUser(userId: string) {
  try {
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  } catch {
    // Session sync is best-effort during local development
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState(mockProvider.id);

  const currentUser = useMemo(
    () => mockUsers.find((u) => u.id === currentUserId) ?? mockProvider,
    [currentUserId],
  );

  useEffect(() => {
    void syncSessionUser(currentUserId);
  }, [currentUserId]);

  const switchUser = useCallback((userId: string) => {
    setCurrentUserId(userId);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      users: mockUsers,
      switchUser,
      isProvider: currentUser.role === "PROVIDER",
    }),
    [currentUser, switchUser],
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export { mockClients, mockProvider };
