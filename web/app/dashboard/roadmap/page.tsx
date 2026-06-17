'use client';

import { useRouter } from 'next/navigation';
import DropLogicLogo from '@/components/brand/DropLogicLogo';
import RoadmapPage from './RoadmapContent';

export default function RoadmapRoutePage() {
  const router = useRouter();

  return (
    <div className="dl-page dl-page-elevated font-sans antialiased relative overflow-hidden min-h-screen">
      <div className="dl-grid-bg" />
      <nav className="dl-nav h-16 flex items-center justify-between px-6 md:px-10 relative shrink-0 z-10">
        <DropLogicLogo href="/dashboard" size="md" className="italic text-zinc-100" />
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-violet-300 transition"
        >
          ← Back to Dashboard
        </button>
      </nav>
      <RoadmapPage />
    </div>
  );
}
