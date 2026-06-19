import { createClerkClient } from '@clerk/backend';
import { auth, currentUser } from '@clerk/nextjs/server';

export type ClerkRouteAuth = {
  userId: string | null;
  email: string | null;
};

function isClerkMiddlewareMissingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /clerkMiddleware|can't detect usage of clerkMiddleware/i.test(message);
}

async function authFromRequest(request: Request): Promise<ClerkRouteAuth> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  if (!secretKey || !publishableKey) {
    return { userId: null, email: null };
  }

  const clerk = createClerkClient({ secretKey, publishableKey });
  const state = await clerk.authenticateRequest(request, {
    secretKey,
    publishableKey,
  });

  if (!state.isAuthenticated) {
    return { userId: null, email: null };
  }

  const authObject = state.toAuth();
  const userId = authObject.userId ?? null;
  if (!userId) {
    return { userId: null, email: null };
  }

  let email: string | null = null;
  try {
    const user = await clerk.users.getUser(userId);
    email =
      user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)
        ?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      null;
  } catch {
    // Email is optional for activation.
  }

  return { userId, email };
}

/**
 * Resolve the signed-in Clerk user in Route Handlers.
 * Uses auth() when proxy/middleware is active; falls back to authenticateRequest
 * when Vercel does not attach the middleware context (production monorepo edge case).
 */
export async function resolveClerkRouteAuth(request: Request): Promise<ClerkRouteAuth> {
  try {
    const { userId } = await auth();
    if (userId) {
      let email: string | null = null;
      try {
        const user = await currentUser();
        email = user?.primaryEmailAddress?.emailAddress ?? null;
      } catch {
        // ignore
      }
      return { userId, email };
    }

    return { userId: null, email: null };
  } catch (error) {
    if (!isClerkMiddlewareMissingError(error)) {
      throw error;
    }
  }

  return authFromRequest(request);
}
