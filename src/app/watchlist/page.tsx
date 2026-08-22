'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForexStore } from '@/lib/store';
import {
  Shield,
  Eye,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------

const sentimentBadge: Record<string, string> = {
  'Very Bullish': 'text-emerald-400 bg-emerald-400/10',
  Bullish: 'text-emerald-400 bg-emerald-400/10',
  Neutral: 'text-zinc-400 bg-zinc-400/10',
  Bearish: 'text-red-400 bg-red-400/10',
  'Very Bearish': 'text-red-400 bg-red-400/10',
};

const trendIcon = (trend: string) => {
  if (trend === 'Bullish') return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (trend === 'Bearish') return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-zinc-500" />;
};

function changeColor(v: number) {
  return v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-zinc-400';
}

function heatColor(pct: number) {
  if (pct >= 0.5) return 'bg-emerald-500';
  if (pct >= 0.15) return 'bg-emerald-700';
  if (pct > 0) return 'bg-emerald-900';
  if (pct === 0) return 'bg-zinc-800';
  if (pct > -0.15) return 'bg-red-900';
  if (pct > -0.5) return 'bg-red-700';
  return 'bg-red-500';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WatchlistPage() {
  const pairs = useForexStore(s => s.pairs);
  const watchlist = useForexStore(s => s.watchlist);
  const addToWatchlist = useForexStore(s => s.addToWatchlist);
  const removeFromWatchlist = useForexStore(s => s.removeFromWatchlist);
  const updatePrices = useForexStore(s => s.updatePrices);

  const [addPair, setAddPair] = useState('');

  // Live ticks
  useEffect(() => {
    const id = setInterval(updatePrices, 2000);
    return () => clearInterval(id);
  }, [updatePrices]);

  // Watchlist pair data
  const watchlistData = useMemo(
    () => watchlist.map(s => pairs.find(p => p.symbol === s)).filter(Boolean),
    [watchlist, pairs],
  );

  // Available pairs not in watchlist
  const available = useMemo(
    () => pairs.filter(p => !watchlist.includes(p.symbol)),
    [pairs, watchlist],
  );

  function handleAdd() {
    const target = addPair || available[0]?.symbol;
    if (target && !watchlist.includes(target)) {
      addToWatchlist(target);
      setAddPair('');
    }
  }

  return (
    <div className="space-y-6">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Daftar Pantau</span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Add to watchlist                                                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-end gap-2">
        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Tambah Pasangan</span>
          <select value={addPair} onChange={e => setAddPair(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500">
            {available.length === 0
              ? <option disabled>Semua pasangan sudah ditambahkan</option>
              : available.map(p => <option key={p.symbol} value={p.symbol}>{p.symbol}</option>)
            }
          </select>
        </label>
        <button onClick={handleAdd} disabled={available.length === 0}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" /> Tambah
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Mini Heatmap                                                      */}
      {/* ----------------------------------------------------------------- */}
      {watchlistData.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Eye className="h-4 w-4" /> Peta Panas Daftar Pantau
          </h2>
          <div className="flex flex-wrap gap-2">
            {watchlistData.map(p => p && (
              <div key={p.symbol}
                className={`flex flex-col items-center justify-center rounded-lg px-4 py-3 min-w-[80px] ${heatColor(p.changePercent)}`}>
                <span className="text-[10px] font-bold text-white/90 tracking-wide">{p.symbol}</span>
                <span className="font-mono text-xs font-semibold text-white">
                  {p.changePercent >= 0 ? '+' : ''}{p.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Watchlist Cards                                                    */}
      {/* ----------------------------------------------------------------- */}
      {watchlistData.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          Daftar pantau Anda masih kosong. Pilih pasangan di atas untuk mulai memantau.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {watchlistData.map(p => p && (
            <div key={p.symbol} className="group relative rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition">
              {/* Remove button */}
              <button onClick={() => removeFromWatchlist(p.symbol)}
                className="absolute right-2 top-2 rounded p-0.5 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-sm font-bold text-zinc-100">{p.symbol}</span>
                {trendIcon(p.trend)}
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${sentimentBadge[p.sentiment] ?? 'text-zinc-400 bg-zinc-400/10'}`}>
                  {p.sentiment}
                </span>
              </div>

              {/* Price */}
              <div className="mb-3">
                <span className="font-mono text-lg font-bold text-zinc-100">{p.price.toFixed(p.symbol.includes('JPY') ? 2 : 4)}</span>
                <span className={`ml-2 font-mono text-xs font-semibold ${changeColor(p.changePercent)}`}>
                  {p.changePercent >= 0 ? '+' : ''}{p.changePercent.toFixed(2)}%
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Bid</span>
                  <span className="font-mono text-zinc-300">{p.bid.toFixed(p.symbol.includes('JPY') ? 2 : 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ask</span>
                  <span className="font-mono text-zinc-300">{p.ask.toFixed(p.symbol.includes('JPY') ? 2 : 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Spread</span>
                  <span className="font-mono text-zinc-300">{p.spread.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">RSI</span>
                  <span className={`font-mono ${p.rsi > 70 ? 'text-red-400' : p.rsi < 30 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {p.rsi.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Trend</span>
                  <span className={`font-semibold ${p.trend === 'Bullish' ? 'text-emerald-400' : p.trend === 'Bearish' ? 'text-red-400' : 'text-zinc-400'}`}>
                    {p.trend}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">AI Score</span>
                  <span className={`font-mono font-semibold ${p.aiScore >= 70 ? 'text-emerald-400' : p.aiScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {p.aiScore}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Comparison Table                                                  */}
      {/* ----------------------------------------------------------------- */}
      {watchlistData.length >= 2 && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          <h2 className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Quick Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/50 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2">Pair</th>
                  <th className="px-4 py-2 text-right font-mono">Price</th>
                  <th className="px-4 py-2 text-right font-mono">Change%</th>
                  <th className="px-4 py-2 text-right font-mono">Spread</th>
                  <th className="px-4 py-2 text-right font-mono">RSI</th>
                  <th className="px-4 py-2">Trend</th>
                  <th className="px-4 py-2 text-right font-mono">AI</th>
                  <th className="px-4 py-2">Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {watchlistData.map(p => p && (
                  <tr key={p.symbol}>
                    <td className="px-4 py-2.5 font-mono font-semibold text-zinc-200">{p.symbol}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{p.price.toFixed(p.symbol.includes('JPY') ? 2 : 4)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono font-semibold ${changeColor(p.changePercent)}`}>
                      {p.changePercent >= 0 ? '+' : ''}{p.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{p.spread.toFixed(1)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${p.rsi > 70 ? 'text-red-400' : p.rsi < 30 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {p.rsi.toFixed(1)}
                    </td>
                    <td className={`px-4 py-2.5 font-semibold ${p.trend === 'Bullish' ? 'text-emerald-400' : p.trend === 'Bearish' ? 'text-red-400' : 'text-zinc-400'}`}>
                      {p.trend}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono font-semibold ${p.aiScore >= 70 ? 'text-emerald-400' : p.aiScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {p.aiScore}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${sentimentBadge[p.sentiment] ?? 'text-zinc-400 bg-zinc-400/10'}`}>
                        {p.sentiment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
