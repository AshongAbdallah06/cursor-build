"use client";

import { SignInForm } from "@/components/auth/sign-in-form";

interface LoginPageClientProps {
  nextPath: string;
  error: string | null;
}

export function LoginPageClient({ nextPath, error }: LoginPageClientProps) {
  return <SignInForm nextPath={nextPath} error={error} />;
}
