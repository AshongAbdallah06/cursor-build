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
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/types";
import { buildLoginUrl } from "@/lib/auth/route-guards";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";

interface UserContextValue {
  currentUser: User;
  loading: boolean;
  refreshUser: () => Promise<void>;
  isProvider: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

function parseUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id),
    email: String(raw.email),
    role: raw.role as User["role"],
    fullName: String(raw.fullName),
    createdAt: new Date(String(raw.createdAt)),
    updatedAt: new Date(String(raw.updatedAt)),
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectToLogin = useCallback(() => {
    router.replace(buildLoginUrl(pathname));
  }, [pathname, router]);

  const refreshUser = useCallback(async () => {
    const response = await fetch("/api/session");

    if (!response.ok) {
      throw new Error("Failed to load session");
    }

    const data = (await response.json()) as {
      user?: Record<string, unknown> | null;
    };

    if (!data.user) {
      await fetch("/api/session", { method: "DELETE" });
      setCurrentUser(null);
      return;
    }

    setCurrentUser(parseUser(data.user));
  }, []);

  useEffect(() => {
    void refreshUser()
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    if (!loading && !currentUser) {
      redirectToLogin();
    }
  }, [loading, currentUser, redirectToLogin]);

  const value = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    return {
      currentUser,
      loading,
      refreshUser,
      isProvider: currentUser.role === "PROVIDER",
    };
  }, [currentUser, loading, refreshUser]);

  if (loading || !value) {
    return <DashboardShellSkeleton />;
  }

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
