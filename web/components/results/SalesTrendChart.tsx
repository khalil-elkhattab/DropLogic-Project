'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type SalesTrendPoint = {
  date: string;
  label: string;
  volume: number;
};

type SalesTrendChartProps = {
  points: SalesTrendPoint[];
  direction: 'scaling' | 'dying' | 'flat' | string;
  deltaPct: number;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SalesTrendPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-zinc-900/95 px-3 py-2 text-[11px] shadow-xl">
      <p className="font-bold text-white">{point.label}</p>
      <p className="text-emerald-400">{point.volume.toLocaleString()} units</p>
    </div>
  );
}

export default function SalesTrendChart({ points, direction, deltaPct }: SalesTrendChartProps) {
  const stroke = direction === 'dying' ? '#f87171' : direction === 'flat' ? '#a1a1aa' : '#34d399';
  const fillId = `sales-gradient-${direction}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-sm transition-opacity duration-500">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-emerald-400/80">
            // Sales Volume Trend
          </p>
          <h3 className="text-lg font-black tracking-tight text-white">Last 7 Days</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
            direction === 'scaling'
              ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30'
              : direction === 'dying'
                ? 'bg-red-500/15 text-red-300 ring-1 ring-red-400/30'
                : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-500/30'
          }`}
        >
          {direction === 'scaling' ? 'Scaling ↑' : direction === 'dying' ? 'Cooling ↓' : 'Flat →'}{' '}
          {deltaPct > 0 ? '+' : ''}
          {deltaPct}%
        </span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="volume"
              stroke={stroke}
              strokeWidth={2.5}
              fill={`url(#${fillId})`}
              dot={{ r: 3, fill: stroke, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#fff', stroke: stroke, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
