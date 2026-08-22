'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForexStore } from '@/lib/store';
import { generateScannerResults } from '@/lib/mock-data';
import type { ScannerResult } from '@/lib/types';
import { Shield, Search, ArrowUp, ArrowDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Filter conditions the user can toggle
// ---------------------------------------------------------------------------

const CONDITIONS = [
  'Strong Bullish',
  'Strong Bearish',
  'RSI Oversold',
  'RSI Overbought',
  'EMA Crossover',
  'MACD Crossover',
  'Breakout',
  'Breakdown',
  'High Volatility',
  'Low Volatility',
  'Strong Trend',
  'Reversal',
  'News Event',
  'AI High Confidence',
] as const;

// Map a ScannerResult.condition string to the user-facing filter tags it matches
function matchesFilter(result: ScannerResult, active: Set<string>): boolean {
  if (active.size === 0) return true;
  const c = result.condition.toLowerCase();
  const d = result.direction;

  for (const tag of active) {
    switch (tag) {
      case 'Strong Bullish':
        if (d === 'Bullish' && result.score >= 75) return true;
        break;
      case 'Strong Bearish':
        if (d === 'Bearish' && result.score >= 75) return true;
        break;
      case 'RSI Oversold':
        if (c.includes('rsi') && c.includes('oversold')) return true;
        break;
      case 'RSI Overbought':
        if (c.includes('rsi') && c.includes('overbought')) return true;
        break;
      case 'EMA Crossover':
        if (c.includes('ema') || c.includes('golden cross') || c.includes('death cross')) return true;
        break;
      case 'MACD Crossover':
        if (c.includes('macd')) return true;
        break;
      case 'Breakout':
        if (c.includes('breakout')) return true;
        break;
      case 'Breakdown':
        if (c.includes('breakdown')) return true;
        break;
      case 'High Volatility':
        if (c.includes('volatil') || result.details.toLowerCase().includes('high')) return true;
        break;
      case 'Low Volatility':
        if (c.includes('volatil') || result.details.toLowerCase().includes('low')) return true;
        break;
      case 'Strong Trend':
        if (c.includes('trend') || c.includes('engulfing')) return true;
        break;
      case 'Reversal':
        if (c.includes('reversal') || c.includes('pin bar') || c.includes('bounce')) return true;
        break;
      case 'News Event':
        if (c.includes('news')) return true;
        break;
      case 'AI High Confidence':
        if (result.score >= 80) return true;
        break;
    }
  }
  return false;
}

function scoreColor(s: number): string {
  if (s >= 80) return 'text-emerald-400';
  if (s >= 65) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(s: number): string {
  if (s >= 80) return 'bg-emerald-500/15';
  if (s >= 65) return 'bg-amber-500/15';
  return 'bg-red-500/15';
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ScannerPage() {
  const setSelectedPair = useForexStore((s) => s.setSelectedPair);

  const [results, setResults] = useState<ScannerResult[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);

  const scan = useCallback(() => {
    setScanning(true);
    // Simulate brief scan delay
    setTimeout(() => {
      setResults(generateScannerResults());
      setScanning(false);
    }, 400);
  }, []);

  // Auto-scan on mount
  useEffect(() => { scan(); }, [scan]);

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const filtered = useMemo(
    () => results.filter((r) => matchesFilter(r, activeFilters)).sort((a, b) => b.score - a.score),
    [results, activeFilters],
  );

  return (
    <div className="space-y-6">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Pemindai Pasar</span>
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Kondisi Pemindaian</h2>
          <button
            onClick={scan}
            disabled={scanning}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            <Search className="h-3 w-3" />
            {scanning ? 'Memindai...' : 'Pindai Pasar'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => toggleFilter(c)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                activeFilters.has(c)
                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 text-left">Pasangan</th>
                <th className="px-4 py-3 text-left">Kondisi</th>
                <th className="px-4 py-3 text-center">Arah</th>
                <th className="px-4 py-3 text-center">Skor</th>
                <th className="px-4 py-3 text-left">Detail</th>
                <th className="px-4 py-3 text-right">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-zinc-500">
                    {scanning ? 'Memindai pasar...' : 'Tidak ada hasil yang cocok dengan filter yang dipilih.'}
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <tr
                  key={`${r.pair}-${r.condition}-${i}`}
                  onClick={() => setSelectedPair(r.pair)}
                  className="border-b border-zinc-800/50 transition hover:bg-zinc-800/40 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-200">{r.pair}</td>
                  <td className="px-4 py-3 text-zinc-300">{r.condition}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.direction === 'Bullish'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {r.direction === 'Bullish' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                      {r.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded px-2 py-0.5 font-mono text-xs font-bold ${scoreColor(r.score)} ${scoreBg(r.score)}`}>
                      {r.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400 max-w-xs truncate">{r.details}</td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-zinc-500">{formatTime(r.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-[11px] text-zinc-500">
        <span>{filtered.length} hasil ditemukan</span>
        {activeFilters.size > 0 && (
          <button onClick={() => setActiveFilters(new Set())} className="text-zinc-400 underline hover:text-zinc-300">
            Hapus filter
          </button>
        )}
      </div>
    </div>
  );
}
