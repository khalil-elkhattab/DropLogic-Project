import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Required for auth() / currentUser() in Route Handlers and Server Components.
 * Does not force sign-in globally — each API route checks userId and returns 401.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // AppSumo activation (Clerk session must be available for auth() in the handler)
    '/api/activate-appsumo-code',
    // Other authenticated API routes
    '/api/ads/:path*',
    '/api/submit-review-proof',
    '/api/video-studio/usage',
    // Pages + remaining API routes (skip static assets)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
