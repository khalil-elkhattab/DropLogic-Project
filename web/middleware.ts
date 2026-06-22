import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/** Routes that must stay unauthenticated (external webhooks, etc.). */
const isPublicRoute = createRouteMatcher([
  '/api/webhooks/lemonsqueezy',
  '/api/webhooks/lemonsqueezy/(.*)',
]);

/**
 * Required so auth() / currentUser() work in Route Handlers and Server Components.
 * Lemon Squeezy webhooks are explicitly public so payment events are never blocked.
 * resolveClerkRouteAuth() in API routes provides a fallback when middleware context is missing.
 */
export default clerkMiddleware(async (_auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
