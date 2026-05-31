import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { USER_SESSION_COOKIE } from "@/lib/auth/constants";
import {
  buildLoginUrl,
  isPublicApi,
  isPublicPage,
  sanitizeNextPath,
} from "@/lib/auth/route-guards";

function hasSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get(USER_SESSION_COOKIE)?.value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = hasSession(request);

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/session") {
      return NextResponse.next();
    }

    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }

    if (!signedIn) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (signedIn) {
      const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
      return NextResponse.redirect(new URL(next, request.url));
    }

    return NextResponse.next();
  }

  if (isPublicPage(pathname)) {
    return NextResponse.next();
  }

  if (!signedIn) {
    return NextResponse.redirect(
      new URL(buildLoginUrl(pathname), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
