import type { AuthProviderDefinition } from "@/lib/auth/providers/types";
import {
  exchangeGoogleLoginCode,
  getGoogleLoginAuthUrl,
  isGoogleAuthConfigured,
} from "@/lib/auth/google-oauth";
import {
  exchangeGitHubLoginCode,
  getGitHubLoginAuthUrl,
} from "@/lib/auth/providers/github-oauth";
import { isGitHubAuthConfigured } from "@/lib/auth/providers/github-config";
import {
  exchangeFacebookLoginCode,
  getFacebookLoginAuthUrl,
} from "@/lib/auth/providers/facebook-oauth";
import { isFacebookAuthConfigured } from "@/lib/auth/providers/facebook-config";

export const googleAuthProvider: AuthProviderDefinition = {
  id: "google",
  name: "Google",
  isConfigured: isGoogleAuthConfigured,
  getAuthorizeUrl: getGoogleLoginAuthUrl,
  exchangeCode: async (code) => {
    const profile = await exchangeGoogleLoginCode(code);
    return {
      provider: "google",
      providerId: profile.googleId,
      email: profile.email,
      fullName: profile.fullName,
      imageUrl: profile.imageUrl,
    };
  },
};

export const githubAuthProvider: AuthProviderDefinition = {
  id: "github",
  name: "GitHub",
  isConfigured: isGitHubAuthConfigured,
  getAuthorizeUrl: getGitHubLoginAuthUrl,
  exchangeCode: exchangeGitHubLoginCode,
};

export const facebookAuthProvider: AuthProviderDefinition = {
  id: "facebook",
  name: "Facebook",
  isConfigured: isFacebookAuthConfigured,
  getAuthorizeUrl: getFacebookLoginAuthUrl,
  exchangeCode: exchangeFacebookLoginCode,
};

export const AUTH_PROVIDERS: AuthProviderDefinition[] = [
  googleAuthProvider,
  githubAuthProvider,
  facebookAuthProvider,
];

export function getAuthProvider(id: string): AuthProviderDefinition | null {
  return AUTH_PROVIDERS.find((provider) => provider.id === id) ?? null;
}

export function getConfiguredAuthProviders(): AuthProviderDefinition[] {
  return AUTH_PROVIDERS.filter((provider) => provider.isConfigured());
}
