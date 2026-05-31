import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

function getStateSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.GOOGLE_CLIENT_SECRET ??
    "caltask-dev-secret"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", getStateSecret()).update(payload).digest("hex");
}

function verifySignedPayload(payload: string, signature: string): boolean {
  const expected = signPayload(payload);
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    sigBuffer.length === expectedBuffer.length &&
    timingSafeEqual(sigBuffer, expectedBuffer)
  );
}

function encodeState(payload: string): string {
  const signature = signPayload(payload);
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function decodeSignedState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return null;

    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);

    if (!verifySignedPayload(payload, signature)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function isStateFresh(issuedAtStr: string): boolean {
  const issuedAt = Number(issuedAtStr);
  return Boolean(issuedAt) && Date.now() - issuedAt <= STATE_TTL_MS;
}

export function createOAuthState(userId: string): string {
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now().toString();
  const payload = `calendar:${userId}:${nonce}:${issuedAt}`;
  return encodeState(payload);
}

export function verifyOAuthState(state: string): { userId: string } | null {
  const payload = decodeSignedState(state);
  if (!payload) return null;

  const [purpose, userId, , issuedAtStr] = payload.split(":");
  if (purpose !== "calendar" || !userId || !isStateFresh(issuedAtStr)) {
    return null;
  }

  return { userId };
}

export function createLoginOAuthState(nextPath: string): string {
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now().toString();
  const encodedPath = Buffer.from(nextPath, "utf8").toString("base64url");
  const payload = `login:${encodedPath}:${nonce}:${issuedAt}`;
  return encodeState(payload);
}

export function verifyLoginOAuthState(
  state: string,
): { nextPath: string } | null {
  const payload = decodeSignedState(state);
  if (!payload) return null;

  const parts = payload.split(":");
  if (parts.length < 4 || parts[0] !== "login") {
    return null;
  }

  const [, encodedPath, , issuedAtStr] = parts;
  if (!encodedPath || !isStateFresh(issuedAtStr)) {
    return null;
  }

  let nextPath: string;
  try {
    nextPath = Buffer.from(encodedPath, "base64url").toString("utf8");
  } catch {
    return null;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return { nextPath: "/calendar" };
  }

  return { nextPath };
}
