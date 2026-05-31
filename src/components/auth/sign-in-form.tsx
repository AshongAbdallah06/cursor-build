"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import type { AuthProviderId } from "@/lib/auth/providers/types";
import {
  PROVIDER_BUTTON_STYLES,
  PROVIDER_ICONS,
} from "@/components/auth/provider-icons";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AuthProviderOption {
  id: AuthProviderId;
  name: string;
}

interface SignInFormProps {
  nextPath: string;
  error?: string | null;
}

export function SignInForm({ nextPath, error }: SignInFormProps) {
  const [providers, setProviders] = useState<AuthProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/auth/providers")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load sign-in options");
        }

        return response.json() as Promise<{ providers?: AuthProviderOption[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setProviders(data.providers ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Could not load sign-in options",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-primary px-10 py-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <CalendarDays className="size-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">{APP_NAME}</p>
              <p className="text-sm text-primary-foreground/80">
                Calendar and task coordination
              </p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Your calendar. Your schedule.
            </h1>
            <p className="mt-3 max-w-md text-base text-primary-foreground/85">
              Sign in to manage your schedule, share a request link, sync Google
              Calendar, and use the AI assistant.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-primary-foreground/90">
            {[
              "Your own dashboard and shareable booking link",
              "Google Calendar sync and AI scheduling help",
              "Others can request time without needing your login",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">
          Sign in to access your dashboard.
        </p>
      </section>

      <section className="flex items-center justify-center bg-muted/20 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary lg:hidden">
              <CalendarDays className="size-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Sign in to CalTask
            </h2>
            <p className="text-sm text-muted-foreground">
              Create your account or return to your workspace. Anyone can sign in
              with Google, GitHub, or Facebook.
            </p>
          </div>

          {(error || loadError) && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error ?? loadError}
            </p>
          )}

          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading sign-in options…
              </div>
            ) : providers.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                No sign-in providers are configured yet. Add OAuth credentials
                for Google, GitHub, or Facebook in your environment variables.
              </div>
            ) : (
              providers.map((provider) => {
                const Icon = PROVIDER_ICONS[provider.id];
                const styles = PROVIDER_BUTTON_STYLES[provider.id];
                const href = `/api/auth/${provider.id}/authorize?next=${encodeURIComponent(nextPath)}`;

                return (
                  <Link
                    key={provider.id}
                    href={href}
                    className={cn(
                      "flex h-12 w-full items-center justify-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors",
                      styles.button,
                    )}
                  >
                    <Icon className={styles.icon} />
                    Continue with {provider.name}
                  </Link>
                );
              })
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground lg:text-left">
            First sign-in creates your account. People who submit via your share
            link are linked to you automatically when they request time.
          </p>
        </div>
      </section>
    </div>
  );
}
