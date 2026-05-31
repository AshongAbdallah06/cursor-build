const PRISMA_ERROR_MESSAGES: Record<string, string> = {
  ETIMEDOUT:
    "The database connection timed out. Please check your connection and try again.",
  P1001: "Could not reach the database. Please try again in a moment.",
  P1002: "The database server timed out. Please try again.",
  P2022:
    "The database schema is out of date. Run migrations and restart the server.",
};

function isPrismaLikeError(
  err: unknown,
): err is { code?: string; message?: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

function isRawPrismaMessage(message: string): boolean {
  return (
    message.includes("Invalid `") ||
    message.includes("prisma].") ||
    message.includes("__TURBOPACK__") ||
    message.includes("invocation in")
  );
}

export function formatApiError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isPrismaLikeError(err)) {
    const mapped = err.code ? PRISMA_ERROR_MESSAGES[err.code] : undefined;
    if (mapped) return mapped;
  }

  if (err instanceof Error) {
    if (isRawPrismaMessage(err.message)) {
      return fallback;
    }

    if (err.message === "User not found") {
      return "Your account could not be found. Try signing in again.";
    }

    if (err.message.length <= 240) {
      return err.message;
    }
  }

  return fallback;
}
