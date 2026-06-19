import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Next.js 16+ uses proxy.ts (middleware.ts is deprecated).
 * Required so auth() / currentUser() work in Route Handlers and Server Components.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
