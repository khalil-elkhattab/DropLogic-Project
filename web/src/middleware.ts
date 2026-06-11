import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/api/webhooks/lemonsqueezy',
  '/api/run-analysis',
  '/api/analysis-status(.*)',
  '/api/backend-health',
]);

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