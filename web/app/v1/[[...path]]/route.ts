import { createFrontendApiProxyHandlers } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Clerk Frontend API proxy for https://droplogicai.com/v1
 * Must match NEXT_PUBLIC_CLERK_PROXY_URL and Clerk Dashboard → Domains → proxy URL.
 * Plain next.config rewrites cannot satisfy Clerk's proxy verification (missing headers).
 */
export const { GET, POST, PUT, DELETE, PATCH } = createFrontendApiProxyHandlers({
  proxyPath: '/v1',
});
