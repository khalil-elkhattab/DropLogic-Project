import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Required so auth() / currentUser() work in Route Handlers and Server Components.
 * resolveClerkRouteAuth() in API routes provides a fallback when middleware context is missing.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
