import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

function getStateSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.GOOGLE_CLIENT_SECRET ??
    "caltask-dev-secret"
  );
}

export function createOAuthState(userId: string): string {
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now().toString();
  const payload = `${userId}:${nonce}:${issuedAt}`;
  const signature = createHmac("sha256", getStateSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyOAuthState(state: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return null;

    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", getStateSecret())
      .update(payload)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    const [userId, , issuedAtStr] = payload.split(":");
    const issuedAt = Number(issuedAtStr);
    if (!userId || !issuedAt || Date.now() - issuedAt > STATE_TTL_MS) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}
