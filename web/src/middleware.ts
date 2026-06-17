import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/activate-appsumo(.*)',
  '/api/activate-appsumo-code',
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
    // Exclude /activate-appsumo entirely — page handles sign-in via Clerk components client-side
    '/((?!_next|activate-appsumo|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
