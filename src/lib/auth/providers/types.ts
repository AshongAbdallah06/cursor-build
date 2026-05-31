export const AUTH_PROVIDER_IDS = ["google", "github", "facebook"] as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[number];

export interface OAuthProfile {
  provider: AuthProviderId;
  providerId: string;
  email: string;
  fullName: string;
  imageUrl: string | null;
}

export interface AuthProviderDefinition {
  id: AuthProviderId;
  name: string;
  isConfigured: () => boolean;
  getAuthorizeUrl: (state: string) => string;
  exchangeCode: (code: string) => Promise<OAuthProfile>;
}

export function isAuthProviderId(value: string): value is AuthProviderId {
  return AUTH_PROVIDER_IDS.includes(value as AuthProviderId);
}
