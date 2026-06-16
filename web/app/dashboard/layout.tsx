/** Dashboard routes use Clerk hooks — skip static prerender at build time. */
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
