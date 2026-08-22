'use client';

import { useMemo, useState } from 'react';
import { generateCorrelationMatrix } from '@/lib/mock-data';
import type { CorrelationData } from '@/lib/types';
import { Shield, AlertTriangle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'] as const;
const TIMEFRAMES = ['1H', '4H', 'Daily', 'Weekly'] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tfKey(tf: Timeframe): keyof CorrelationData {
  switch (tf) {
    case '1H': return 'correlation1h';
    case '4H': return 'correlation4h';
    case 'Daily': return 'correlationDaily';
    case 'Weekly': return 'correlationWeekly';
  }
}

function cellColor(v: number): string {
  if (v > 0.7) return 'bg-blue-600/60';
  if (v > 0.3) return 'bg-blue-500/30';
  if (v >= -0.3) return 'bg-zinc-700/40';
  if (v >= -0.7) return 'bg-red-500/30';
  return 'bg-red-600/60';
}

function cellText(v: number): string {
  if (v > 0.7) return 'text-blue-200';
  if (v > 0.3) return 'text-blue-300';
  if (v >= -0.3) return 'text-zinc-400';
  if (v >= -0.7) return 'text-red-300';
  return 'text-red-200';
}

function explainCorrelation(p1: string, p2: string, v: number): string {
  const abs = Math.abs(v);
  const dir = v > 0 ? 'positive' : 'negative';
  const strength = abs > 0.85 ? 'very strong' : abs > 0.7 ? 'strong' : abs > 0.5 ? 'moderate' : 'weak';

  // Extract common currency for explanation
  const [b1, q1] = p1.split('/');
  const [b2, q2] = p2.split('/');
  let reason = '';
  if (q1 === q2) reason = ` -- both quoted against ${q1}`;
  else if (b1 === b2) reason = ` -- both based on ${b1}`;
  else if (q1 === b2) reason = ` -- ${q1} links both pairs`;
  else if (b1 === q2) reason = ` -- ${b1} links both pairs`;
  else if (v < -0.5) reason = ' -- inverse USD exposure';

  return `${p1} and ${p2} show ${strength} ${dir} correlation (${v.toFixed(2)})${reason}.`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CorrelationPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');

  // Generate once per mount; memo on timeframe for lookup map
  const rawData = useMemo(() => generateCorrelationMatrix(), []);

  // Build pair-pair lookup for the selected timeframe
  const matrix = useMemo(() => {
    const key = tfKey(timeframe);
    const map = new Map<string, number>();
    for (const d of rawData) {
      const v = d[key] as number;
      map.set(`${d.pair1}|${d.pair2}`, v);
      map.set(`${d.pair2}|${d.pair1}`, v);
    }
    return map;
  }, [rawData, timeframe]);

  const getCorr = (a: string, b: string): number | null => {
    if (a === b) return 1;
    return matrix.get(`${a}|${b}`) ?? null;
  };

  // Key correlations: top 5 strongest positive & negative
  const keyCorrelations = useMemo(() => {
    const key = tfKey(timeframe);
    const entries = rawData.map((d) => ({ p1: d.pair1, p2: d.pair2, v: d[key] as number }));
    const sorted = [...entries].sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
    const positive = sorted.filter((e) => e.v > 0).slice(0, 5);
    const negative = sorted.filter((e) => e.v < 0).slice(0, 5);
    return { positive, negative };
  }, [rawData, timeframe]);

  // High-correlation warnings
  const warnings = useMemo(() => {
    const key = tfKey(timeframe);
    return rawData
      .filter((d) => {
        const v = d[key] as number;
        return v > 0.85 || v < -0.85;
      })
      .map((d) => ({ p1: d.pair1, p2: d.pair2, v: d[key] as number }));
  }, [rawData, timeframe]);

  return (
    <div className="space-y-6">
      {/* Pro Live badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          <Shield className="h-3 w-3" />
          PRO TRADING TERMINAL
        </span>
        <span className="text-xs text-zinc-500 font-mono">Analisis Matriks Korelasi</span>
      </div>

      {/* Timeframe selector + warnings */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-zinc-800/60 p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                timeframe === tf
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {warnings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {warnings.map((w) => (
              <span
                key={`${w.p1}-${w.p2}`}
                className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-400 ring-1 ring-amber-500/20"
              >
                <AlertTriangle className="h-3 w-3" />
                Korelasi tinggi: {w.p1} / {w.p2} ({w.v.toFixed(2)})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Correlation matrix */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 text-left border-b border-r border-zinc-800">
                  Pasangan
                </th>
                {PAIRS.map((p) => (
                  <th
                    key={p}
                    className="px-2 py-2 text-center text-[10px] font-mono font-semibold text-zinc-400 border-b border-zinc-800 whitespace-nowrap"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAIRS.map((row) => (
                <tr key={row}>
                  <td className="sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-[11px] font-mono font-semibold text-zinc-300 border-r border-zinc-800 whitespace-nowrap">
                    {row}
                  </td>
                  {PAIRS.map((col) => {
                    const v = getCorr(row, col);
                    const isDiag = row === col;
                    return (
                      <td
                        key={col}
                        title={v !== null ? `${row} vs ${col}: ${v.toFixed(2)}` : 'N/A'}
                        className={`px-2 py-2 text-center font-mono text-xs border-zinc-800/30 ${
                          isDiag
                            ? 'bg-zinc-800/60 text-zinc-500 font-semibold'
                            : v !== null
                              ? `${cellColor(v)} ${cellText(v)} font-medium`
                              : 'bg-zinc-900 text-zinc-600'
                        }`}
                      >
                        {v !== null ? v.toFixed(2) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 border-t border-zinc-800 px-4 py-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5 rounded bg-blue-600/60" />
            <span className="text-zinc-400">&gt;0.7 Positif Kuat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5 rounded bg-blue-500/30" />
            <span className="text-zinc-400">0.3-0.7 Positif Sedang</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5 rounded bg-zinc-700/40" />
            <span className="text-zinc-400">-0.3-0.3 Netral</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5 rounded bg-red-500/30" />
            <span className="text-zinc-400">-0.7--0.3 Negatif Sedang</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5 rounded bg-red-600/60" />
            <span className="text-zinc-400">&lt;-0.7 Negatif Kuat</span>
          </div>
        </div>
      </div>

      {/* Key Correlations */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Strongest positive */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Korelasi Positif Teratas
          </h3>
          <div className="space-y-2">
            {keyCorrelations.positive.map((e) => (
              <div key={`${e.p1}-${e.p2}`} className="rounded border border-zinc-800/50 bg-zinc-800/30 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-blue-300">
                    {e.p1} / {e.p2}
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-400">{e.v.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">{explainCorrelation(e.p1, e.p2, e.v)}</p>
              </div>
            ))}
            {keyCorrelations.positive.length === 0 && (
              <p className="text-xs text-zinc-500">Tidak ada korelasi positif yang signifikan.</p>
            )}
          </div>
        </div>

        {/* Strongest negative */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Korelasi Negatif Teratas
          </h3>
          <div className="space-y-2">
            {keyCorrelations.negative.map((e) => (
              <div key={`${e.p1}-${e.p2}`} className="rounded border border-zinc-800/50 bg-zinc-800/30 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-red-300">
                    {e.p1} / {e.p2}
                  </span>
                  <span className="font-mono text-xs font-bold text-red-400">{e.v.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">{explainCorrelation(e.p1, e.p2, e.v)}</p>
              </div>
            ))}
            {keyCorrelations.negative.length === 0 && (
              <p className="text-xs text-zinc-500">Tidak ada korelasi negatif yang signifikan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
