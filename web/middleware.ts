import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/api/activate-appsumo-code',
  '/api/webhooks/lemonsqueezy',
  '/api/run-analysis',
  '/api/analysis-status(.*)',
  '/api/backend-health',
]);

const clerkHandler = clerkMiddleware(async (_auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }
});

function isActivateAppSumoRoute(pathname: string): boolean {
  return pathname === '/activate-appsumo' || pathname.startsWith('/activate-appsumo/');
}

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (isActivateAppSumoRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return clerkHandler(request, event);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|activate-appsumo|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
