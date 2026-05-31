import { google } from "googleapis";
import {
  getGoogleAuthOAuthConfig,
  GOOGLE_AUTH_SCOPES,
  isGoogleAuthConfigured,
} from "@/lib/google/config";

export function createGoogleAuthOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getGoogleAuthOAuthConfig();

  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is not configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleLoginAuthUrl(state: string): string {
  const oauth2Client = createGoogleAuthOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    scope: GOOGLE_AUTH_SCOPES,
    state,
  });
}

export interface GoogleLoginProfile {
  googleId: string;
  email: string;
  fullName: string;
  imageUrl: string | null;
}

export async function exchangeGoogleLoginCode(
  code: string,
): Promise<GoogleLoginProfile> {
  const oauth2Client = createGoogleAuthOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const profile = await oauth2.userinfo.get();

  const googleId = profile.data.id;
  const email = profile.data.email;

  if (!googleId || !email) {
    throw new Error("Google did not return a complete profile");
  }

  return {
    googleId,
    email: email.trim().toLowerCase(),
    fullName: profile.data.name?.trim() || email.split("@")[0] || "User",
    imageUrl: profile.data.picture ?? null,
  };
}

export { isGoogleAuthConfigured };
