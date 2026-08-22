'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForexStore } from '@/lib/store';
import type { CurrencyPair } from '@/lib/types';
import {
  Shield,
  Grid3X3,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type HeatmapMetric = 'change' | 'volatility' | 'momentum' | 'aiScore';

const METRIC_LABELS: Record<HeatmapMetric, string> = {
  change: 'Perubahan %',
  volatility: 'Volatilitas',
  momentum: 'Momentum',
  aiScore: 'Skor AI',
};

function metricValue(pair: CurrencyPair, metric: HeatmapMetric): number {
  switch (metric) {
    case 'change': return pair.changePercent;
    case 'volatility':
      return pair.volatility === 'High' ? 80 : pair.volatility === 'Medium' ? 50 : 20;
    case 'momentum': return pair.rsi;
    case 'aiScore': return pair.aiScore;
  }
}

function metricDisplay(pair: CurrencyPair, metric: HeatmapMetric): string {
  switch (metric) {
    case 'change': return `${pair.changePercent >= 0 ? '+' : ''}${pair.changePercent.toFixed(2)}%`;
    case 'volatility': return pair.volatility;
    case 'momentum': return `RSI ${pair.rsi.toFixed(1)}`;
    case 'aiScore': return `${pair.aiScore}`;
  }
}

/**
 * Map a metric value to an HSL background color.
 * - change%: negative=red, positive=green
 * - volatility: low=cool, high=warm
 * - momentum(RSI): <30=oversold green, >70=overbought red, mid=neutral
 * - aiScore: low=red, high=green
 */
function tileColor(pair: CurrencyPair, metric: HeatmapMetric): string {
  const v = metricValue(pair, metric);

  switch (metric) {
    case 'change': {
      // Range roughly -1% to +1%. Clamp for color.
      const clamped = Math.max(-1, Math.min(1, v));
      if (Math.abs(clamped) < 0.02) return 'hsl(0 0% 22%)'; // neutral
      const hue = clamped > 0 ? 142 : 0;
      const sat = Math.min(80, Math.abs(clamped) * 80);
      const light = 25 + Math.abs(clamped) * 10;
      return `hsl(${hue} ${sat}% ${light}%)`;
    }
    case 'volatility': {
      // 0-100 scale. Low=blue-ish, High=orange/red
      const hue = 200 - v * 2; // 200 (blue) -> 0 (red)
      const sat = 40 + v * 0.3;
      return `hsl(${Math.max(0, hue)} ${sat}% 25%)`;
    }
    case 'momentum': {
      // RSI: 30-70 neutral, <30 green (oversold = buy), >70 red (overbought)
      if (v > 60) {
        const intensity = Math.min(1, (v - 60) / 30);
        return `hsl(142 ${50 + intensity * 30}% ${22 + intensity * 8}%)`;
      }
      if (v < 40) {
        const intensity = Math.min(1, (40 - v) / 30);
        return `hsl(0 ${50 + intensity * 30}% ${22 + intensity * 8}%)`;
      }
      return 'hsl(0 0% 22%)';
    }
    case 'aiScore': {
      // 0-100. Low=red, Mid=neutral, High=green
      if (v >= 60) {
        const intensity = Math.min(1, (v - 60) / 35);
        return `hsl(142 ${40 + intensity * 40}% ${22 + intensity * 8}%)`;
      }
      if (v <= 40) {
        const intensity = Math.min(1, (40 - v) / 30);
        return `hsl(0 ${40 + intensity * 40}% ${22 + intensity * 8}%)`;
      }
      return 'hsl(0 0% 22%)';
    }
  }
}

function TileIcon({ pair, metric }: { pair: CurrencyPair; metric: HeatmapMetric }) {
  const v = metricValue(pair, metric);
  switch (metric) {
    case 'change':
      if (v > 0.02) return <TrendingUp className="h-3.5 w-3.5 text-emerald-300/80" />;
      if (v < -0.02) return <TrendingDown className="h-3.5 w-3.5 text-red-300/80" />;
      return <Minus className="h-3.5 w-3.5 text-zinc-400/80" />;
    case 'momentum':
      if (v > 60) return <TrendingUp className="h-3.5 w-3.5 text-emerald-300/80" />;
      if (v < 40) return <TrendingDown className="h-3.5 w-3.5 text-red-300/80" />;
      return <Minus className="h-3.5 w-3.5 text-zinc-400/80" />;
    case 'aiScore':
      if (v >= 60) return <TrendingUp className="h-3.5 w-3.5 text-emerald-300/80" />;
      if (v <= 40) return <TrendingDown className="h-3.5 w-3.5 text-red-300/80" />;
      return <Minus className="h-3.5 w-3.5 text-zinc-400/80" />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HeatmapPage() {
  const pairs = useForexStore((s) => s.pairs);
  const updatePrices = useForexStore((s) => s.updatePrices);
  const [metric, setMetric] = useState<HeatmapMetric>('change');
  const [hoveredPair, setHoveredPair] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(updatePrices, 2000);
    return () => clearInterval(id);
  }, [updatePrices]);

  const hoveredData = useMemo(
    () => (hoveredPair ? pairs.find((p) => p.symbol === hoveredPair) : null),
    [hoveredPair, pairs],
  );

  return (
    <div className="space-y-6">
      {/* Pro Live badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          <Shield className="h-3 w-3" />
          PRO TRADING TERMINAL
        </span>
        <span className="text-xs text-zinc-500 font-mono">Peta Panas Visual Forex</span>
      </div>

      {/* Metric toggle */}
      <div className="flex items-center gap-2">
        <Grid3X3 className="h-4 w-4 text-zinc-400" />
        <span className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Tampilan:</span>
        <div className="flex gap-1">
          {(Object.keys(METRIC_LABELS) as HeatmapMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                metric === m
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {pairs.map((pair) => {
          const bg = tileColor(pair, metric);
          const d = pair.symbol.includes('JPY') ? 2 : 4;
          return (
            <div
              key={pair.symbol}
              className="group relative cursor-default rounded-xl p-4 transition-all duration-200 hover:scale-[1.03] hover:ring-1 hover:ring-zinc-500/50"
              style={{ backgroundColor: bg }}
              onMouseEnter={() => setHoveredPair(pair.symbol)}
              onMouseLeave={() => setHoveredPair(null)}
            >
              {/* Pair symbol */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-100">{pair.symbol}</span>
                <TileIcon pair={pair} metric={metric} />
              </div>

              {/* Metric value */}
              <div className="mt-1 font-mono text-lg font-semibold text-white/90">
                {metricDisplay(pair, metric)}
              </div>

              {/* Sub info */}
              <div className="mt-1 flex items-center gap-2 text-[10px] text-white/50">
                <span>{pair.price.toFixed(d)}</span>
                <span className={pair.changePercent >= 0 ? 'text-emerald-300/70' : 'text-red-300/70'}>
                  {pair.changePercent >= 0 ? '+' : ''}{pair.changePercent.toFixed(2)}%
                </span>
              </div>

              {/* Hover tooltip */}
              {hoveredPair === pair.symbol && (
                <div className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
                  <div className="mb-1 text-xs font-bold text-zinc-100">{pair.symbol}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    <span className="text-zinc-500">Price</span>
                    <span className="text-right font-mono text-zinc-200">{pair.price.toFixed(d)}</span>
                    <span className="text-zinc-500">Change</span>
                    <span className={`text-right font-mono ${pair.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pair.changePercent >= 0 ? '+' : ''}{pair.changePercent.toFixed(2)}%
                    </span>
                    <span className="text-zinc-500">Spread</span>
                    <span className="text-right font-mono text-zinc-200">{pair.spread.toFixed(1)}</span>
                    <span className="text-zinc-500">RSI</span>
                    <span className="text-right font-mono text-zinc-200">{pair.rsi.toFixed(1)}</span>
                    <span className="text-zinc-500">ATR</span>
                    <span className="text-right font-mono text-zinc-200">{pair.atr.toFixed(d)}</span>
                    <span className="text-zinc-500">Trend</span>
                    <span className={`text-right font-mono ${pair.trend === 'Bullish' ? 'text-emerald-400' : pair.trend === 'Bearish' ? 'text-red-400' : 'text-zinc-400'}`}>
                      {pair.trend}
                    </span>
                    <span className="text-zinc-500">Volatility</span>
                    <span className="text-right font-mono text-zinc-200">{pair.volatility}</span>
                    <span className="text-zinc-500">AI Score</span>
                    <span className="text-right font-mono text-zinc-200">{pair.aiScore}</span>
                    <span className="text-zinc-500">Sentiment</span>
                    <span className={`text-right font-mono ${pair.sentiment.includes('Bullish') ? 'text-emerald-400' : pair.sentiment.includes('Bearish') ? 'text-red-400' : 'text-zinc-400'}`}>
                      {pair.sentiment}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1">
        {metric === 'change' && (
          <>
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(0 80% 30%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(0 40% 27%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(0 0% 22%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(142 40% 27%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(142 80% 30%)' }} />
            <div className="ml-2 flex gap-4 text-[10px] text-zinc-500">
              <span>Pelemahan Kuat</span>
              <span>Netral</span>
              <span>Penguatan Kuat</span>
            </div>
          </>
        )}
        {metric === 'volatility' && (
          <>
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(200 40% 25%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(140 45% 25%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(80 50% 25%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(40 55% 25%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(0 70% 25%)' }} />
            <div className="ml-2 flex gap-4 text-[10px] text-zinc-500">
              <span>Rendah</span>
              <span>Sedang</span>
              <span>Tinggi</span>
            </div>
          </>
        )}
        {(metric === 'momentum' || metric === 'aiScore') && (
          <>
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(0 80% 28%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(0 40% 25%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(0 0% 22%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(142 50% 25%)' }} />
            <div className="h-4 w-8 rounded" style={{ background: 'hsl(142 80% 28%)' }} />
            <div className="ml-2 flex gap-4 text-[10px] text-zinc-500">
              <span>{metric === 'momentum' ? 'Oversold' : 'Lemah'}</span>
              <span>Netral</span>
              <span>{metric === 'momentum' ? 'Overbought' : 'Kuat'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
