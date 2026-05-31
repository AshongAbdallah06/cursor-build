import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/session";
import { sanitizeNextPath } from "@/lib/auth/route-guards";
import { LoginPageClient } from "@/app/login/login-page-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const userId = await getSessionUserId();

  if (userId) {
    redirect(sanitizeNextPath(params.next));
  }

  return (
    <LoginPageClient
      nextPath={sanitizeNextPath(params.next)}
      error={params.error ?? null}
    />
  );
}
