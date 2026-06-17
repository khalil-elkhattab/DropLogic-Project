'use client';

import ReviewUpgradeBanner from '@/components/dashboard/ReviewUpgradeBanner';
import AboutCreatorWidget from '@/components/dashboard/AboutCreatorWidget';

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <ReviewUpgradeBanner />
      <div className="flex-1">{children}</div>
      <AboutCreatorWidget />
    </div>
  );
}
