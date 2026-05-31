import type { UserRole } from "@/types";
import type { OAuthProfile } from "@/lib/auth/providers/types";
import { prisma } from "@/lib/prisma";

function resolveRoleForNewUser(): UserRole {
  return "PROVIDER";
}

export async function findOrCreateUserFromOAuth(profile: OAuthProfile) {
  const existingByProvider = await findUserByOAuthProvider(profile);

  if (existingByProvider) {
    return prisma.user.update({
      where: { id: existingByProvider.id },
      data: {
        fullName: profile.fullName,
        imageUrl: profile.imageUrl,
        email: profile.email,
      },
    });
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: profile.email },
  });

  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        ...oauthProviderIdUpdate(profile),
        fullName: profile.fullName,
        imageUrl: profile.imageUrl,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: profile.email,
      ...oauthProviderIdUpdate(profile),
      fullName: profile.fullName,
      imageUrl: profile.imageUrl,
      role: resolveRoleForNewUser(),
    },
  });
}

async function findUserByOAuthProvider(profile: OAuthProfile) {
  switch (profile.provider) {
    case "google":
      return prisma.user.findUnique({ where: { googleId: profile.providerId } });
    case "github":
      return prisma.user.findUnique({ where: { githubId: profile.providerId } });
    case "facebook":
      return prisma.user.findUnique({
        where: { facebookId: profile.providerId },
      });
  }
}

function oauthProviderIdUpdate(profile: OAuthProfile) {
  switch (profile.provider) {
    case "google":
      return { googleId: profile.providerId };
    case "github":
      return { githubId: profile.providerId };
    case "facebook":
      return { facebookId: profile.providerId };
  }
}

/** @deprecated Use findOrCreateUserFromOAuth */
export async function findOrCreateUserFromGoogle(profile: {
  googleId: string;
  email: string;
  fullName: string;
  imageUrl: string | null;
}) {
  return findOrCreateUserFromOAuth({
    provider: "google",
    providerId: profile.googleId,
    email: profile.email,
    fullName: profile.fullName,
    imageUrl: profile.imageUrl,
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}
