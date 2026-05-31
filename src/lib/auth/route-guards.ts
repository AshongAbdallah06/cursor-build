export const PUBLIC_PAGE_PATHS = ["/login", "/request"] as const;

export const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/public/"] as const;

export function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/calendar";
  }

  return next;
}

export function buildLoginUrl(nextPath?: string | null): string {
  const next = sanitizeNextPath(nextPath ?? null);
  return `/login?next=${encodeURIComponent(next)}`;
}
