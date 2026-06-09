import Link from 'next/link';
import { Cog, Package, Zap } from 'lucide-react';

type DropLogicLogoProps = {
  href?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Appended after the dot, e.g. "Studio" renders as DropLogic.Studio */
  suffix?: string;
};

const iconSizes = {
  sm: { box: 'w-7 h-7', pkg: 'w-3 h-3', zap: 'w-2.5 h-2.5', cog: 'w-2 h-2' },
  md: { box: 'w-8 h-8', pkg: 'w-3.5 h-3.5', zap: 'w-3 h-3', cog: 'w-2.5 h-2.5' },
  lg: { box: 'w-10 h-10', pkg: 'w-[18px] h-[18px]', zap: 'w-3.5 h-3.5', cog: 'w-3 h-3' },
};

const wordmarkSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = iconSizes[size];

  return (
    <div
      className={`relative ${s.box} rounded-[10px] bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-white/10 flex items-center justify-center shadow-lg shadow-blue-600/15 shrink-0`}
      aria-hidden="true"
    >
      <Package className={`${s.pkg} text-white/90`} strokeWidth={2.25} />
      <Zap
        className={`${s.zap} text-blue-400 absolute -top-0.5 -right-0.5`}
        fill="currentColor"
        strokeWidth={0}
      />
      <Cog className={`${s.cog} text-blue-500/70 absolute -bottom-0.5 -left-0.5`} strokeWidth={2.5} />
    </div>
  );
}

export default function DropLogicLogo({
  href = '/',
  showWordmark = true,
  size = 'md',
  className = '',
  suffix = '',
}: DropLogicLogoProps) {
  const content = (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className={`${wordmarkSizes[size]} font-bold tracking-tighter uppercase text-inherit`}>
          DropLogic<span className="text-blue-600">.{suffix}</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-90 transition-opacity" aria-label="DropLogic home">
        {content}
      </Link>
    );
  }

  return content;
}

export { LogoMark };
