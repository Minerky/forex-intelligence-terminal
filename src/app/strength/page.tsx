'use client';

import { useEffect, useMemo } from 'react';
import { useForexStore } from '@/lib/store';
import {
  Shield,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function strengthColor(s: number): string {
  if (s >= 70) return 'text-emerald-400';
  if (s >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function strengthBg(s: number): string {
  if (s >= 70) return 'bg-emerald-500';
  if (s >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function strengthHex(s: number): string {
  if (s >= 70) return '#34d399';
  if (s >= 40) return '#fbbf24';
  return '#f87171';
}

function changeIcon(v: number) {
  if (v > 0.05) return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (v < -0.05) return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-zinc-500" />;
}

function changeText(v: number): string {
  const s = v >= 0 ? '+' : '';
  return `${s}${v.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CurrencyStrengthPage() {
  const currencyStrength = useForexStore((s) => s.currencyStrength);
  const refreshStrength = useForexStore((s) => s.refreshStrength);
  const updatePrices = useForexStore((s) => s.updatePrices);

  useEffect(() => {
    refreshStrength();
    const id = setInterval(updatePrices, 2000);
    return () => clearInterval(id);
  }, [refreshStrength, updatePrices]);

  const sorted = useMemo(
    () => [...currencyStrength].sort((a, b) => b.strength - a.strength),
    [currencyStrength],
  );

  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const bestPair = strongest && weakest ? `${strongest.currency}/${weakest.currency}` : '—';

  // Recharts data
  const chartData = sorted.map((cs) => ({
    currency: cs.currency,
    strength: cs.strength,
  }));

  return (
    <div className="space-y-6">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Pengukur Kekuatan Mata Uang</span>
      </div>

      {/* Strongest vs Weakest highlight */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Zap className="h-3.5 w-3.5" /> Peluang Pasangan Terbaik
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-400">{strongest?.currency}</span>
            <span className="font-mono text-sm text-emerald-400">{strongest?.strength.toFixed(1)}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-zinc-500" />
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-red-400">{weakest?.currency}</span>
            <span className="font-mono text-sm text-red-400">{weakest?.strength.toFixed(1)}</span>
          </div>
          <div className="ml-4 rounded bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-400">
            {bestPair}
          </div>
          <span className="text-xs text-zinc-500">Terkuat vs Terlemah — divergensi tertinggi</span>
        </div>
      </div>

      {/* Main layout: ranking + chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Ranking list */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Gauge className="h-4 w-4" /> Peringkat Kekuatan
          </h2>
          <div className="space-y-2">
            {sorted.map((cs) => (
              <div key={cs.currency} className="flex items-center gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/60 px-3 py-2.5 hover:bg-zinc-800/40">
                {/* Rank */}
                <span className="w-5 text-center font-mono text-xs font-bold text-zinc-500">
                  {cs.rank}
                </span>

                {/* Currency */}
                <span className={`w-10 font-bold ${strengthColor(cs.strength)}`}>{cs.currency}</span>

                {/* Bar */}
                <div className="flex-1">
                  <div className="h-3 w-full rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${strengthBg(cs.strength)} transition-all duration-500`}
                      style={{ width: `${Math.max(4, cs.strength)}%` }}
                    />
                  </div>
                </div>

                {/* Strength value */}
                <span className={`w-12 text-right font-mono text-sm font-semibold ${strengthColor(cs.strength)}`}>
                  {cs.strength.toFixed(1)}
                </span>

                {/* Change columns */}
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-0.5 w-14">
                    {changeIcon(cs.change1h)}
                    <span className="text-zinc-400">1h</span>
                    <span className={cs.change1h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {changeText(cs.change1h)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 w-14">
                    {changeIcon(cs.change4h)}
                    <span className="text-zinc-400">4h</span>
                    <span className={cs.change4h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {changeText(cs.change4h)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 w-14">
                    {changeIcon(cs.change1d)}
                    <span className="text-zinc-400">1d</span>
                    <span className={cs.change1d >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {changeText(cs.change1d)}
                    </span>
                  </div>
                </div>

                {/* Momentum */}
                <div className="w-16 text-right">
                  <span className={`font-mono text-[10px] ${cs.momentum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Mom: {cs.momentum >= 0 ? '+' : ''}{cs.momentum.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recharts bar chart */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Gauge className="h-4 w-4" /> Strength Visualization
          </h2>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} stroke="#3f3f46" />
                <YAxis
                  type="category"
                  dataKey="currency"
                  tick={{ fill: '#e4e4e7', fontSize: 13, fontWeight: 600 }}
                  width={40}
                  stroke="#3f3f46"
                />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e4e4e7', fontWeight: 600 }}
                  itemStyle={{ color: '#a1a1aa' }}
                  formatter={(value) => [`${Number(value).toFixed(1)}`, 'Strength']}
                />
                <Bar dataKey="strength" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, i) => (
                    <Cell key={entry.currency} fill={strengthHex(entry.strength)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-6 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-emerald-500" />
              <span className="text-zinc-400">Strong (&gt;70)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-amber-500" />
              <span className="text-zinc-400">Moderate (40-70)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-red-500" />
              <span className="text-zinc-400">Weak (&lt;40)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
