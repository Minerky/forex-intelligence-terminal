'use client';

import { useEffect } from 'react';
import { useForexStore } from '@/lib/store';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Newspaper,
  Brain,
  Shield,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
}

const MAJOR_SIX = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD'];

const impactColor: Record<string, string> = {
  Low: 'bg-zinc-500',
  Medium: 'bg-yellow-500',
  High: 'bg-red-500',
  Extreme: 'bg-purple-500',
};

const importanceColor: Record<string, string> = {
  Low: 'bg-zinc-500',
  Medium: 'bg-yellow-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
};

const sentimentBadge: Record<string, string> = {
  'Very Bullish': 'text-emerald-400 bg-emerald-400/10',
  Bullish: 'text-emerald-400 bg-emerald-400/10',
  Neutral: 'text-zinc-400 bg-zinc-400/10',
  Bearish: 'text-red-400 bg-red-400/10',
  'Very Bearish': 'text-red-400 bg-red-400/10',
};

// ---------------------------------------------------------------------------
// Tiny sparkline: last 5 ticks as a simple SVG polyline
// ---------------------------------------------------------------------------

function MiniTrend({ trend, changePercent }: { trend: string; changePercent: number }) {
  // Fake 5-point sparkline derived from changePercent
  const sign = changePercent >= 0 ? 1 : -1;
  const pts = [0, 0.3, 0.15, 0.6, 1].map((t) => 20 - sign * t * 16);
  const d = pts.map((y, i) => `${i * 10},${y}`).join(' ');
  const color = changePercent >= 0 ? '#34d399' : '#f87171';

  return (
    <svg width={40} height={24} viewBox="0 0 40 24" className="inline-block">
      <polyline points={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const pairs = useForexStore((s) => s.pairs);
  const updatePrices = useForexStore((s) => s.updatePrices);
  const signals = useForexStore((s) => s.signals);
  const refreshSignals = useForexStore((s) => s.refreshSignals);
  const events = useForexStore((s) => s.events);
  const news = useForexStore((s) => s.news);
  const currencyStrength = useForexStore((s) => s.currencyStrength);
  const refreshStrength = useForexStore((s) => s.refreshStrength);

  // Live price simulation
  useEffect(() => {
    const id = setInterval(updatePrices, 2000);
    return () => clearInterval(id);
  }, [updatePrices]);

  // One-time data loads
  useEffect(() => {
    refreshSignals();
    refreshStrength();
  }, [refreshSignals, refreshStrength]);

  // Derived data
  const majorPairs = MAJOR_SIX.map((s) => pairs.find((p) => p.symbol === s)!).filter(Boolean);
  const sorted = [...pairs].sort((a, b) => b.changePercent - a.changePercent);
  const gainers = sorted.slice(0, 3);
  const losers = sorted.slice(-3).reverse();
  const topSignals = signals.slice(0, 5);
  const upcomingEvents = [...events]
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 5);
  const latestNews = [...news].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);

  // Market sentiment: average sentiment score of major pairs
  const sentimentMap: Record<string, number> = {
    'Very Bullish': 2,
    Bullish: 1,
    Neutral: 0,
    Bearish: -1,
    'Very Bearish': -2,
  };
  const avgSentiment =
    majorPairs.reduce((sum, p) => sum + (sentimentMap[p.sentiment] ?? 0), 0) / (majorPairs.length || 1);
  const marketSentiment = avgSentiment >= 0.3 ? 'Risk On' : avgSentiment <= -0.3 ? 'Risk Off' : 'Mixed';

  return (
    <div className="space-y-6">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Forex Intelligence Terminal</span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 1. Market Overview – 6 major pair cards                           */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Activity className="h-4 w-4" /> Ringkasan Pasar
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {majorPairs.map((p) => (
            <div
              key={p.symbol}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{p.symbol}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    p.aiScore >= 60
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : p.aiScore >= 40
                        ? 'bg-amber-400/10 text-amber-400'
                        : 'bg-red-400/10 text-red-400'
                  }`}
                >
                  AI {p.aiScore}
                </span>
              </div>
              <div className="font-mono text-lg font-semibold text-zinc-100">
                {p.price.toFixed(p.symbol.includes('JPY') ? 2 : 4)}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className={p.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {p.change >= 0 ? '+' : ''}
                  {p.change.toFixed(p.symbol.includes('JPY') ? 2 : 4)}
                </span>
                <span className={p.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  ({p.changePercent >= 0 ? '+' : ''}
                  {p.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Spd: {p.spread.toFixed(p.symbol.includes('JPY') ? 1 : 1)}</span>
                <MiniTrend trend={p.trend} changePercent={p.changePercent} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Lower grid: 2-col on desktop                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 2. Top Movers */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Zap className="h-4 w-4" /> Pergerakan Terbesar
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-500">
                Penguat
              </p>
              {gainers.map((p) => (
                <div key={p.symbol} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="font-medium text-zinc-200">{p.symbol}</span>
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    {p.changePercent >= 0 ? '+' : ''}
                    {p.changePercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-red-500">
                Pelemah
              </p>
              {losers.map((p) => (
                <div key={p.symbol} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="font-medium text-zinc-200">{p.symbol}</span>
                  <span className="flex items-center gap-1 font-mono text-red-400">
                    <TrendingDown className="h-3 w-3" />
                    {p.changePercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. AI Signals Summary */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Brain className="h-4 w-4" /> Sinyal AI
          </h3>
          {topSignals.length === 0 ? (
            <p className="text-xs text-zinc-500">Loading signals...</p>
          ) : (
            <div className="space-y-2">
              {topSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center justify-between rounded border border-zinc-800 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        sig.direction === 'BUY'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : sig.direction === 'SELL'
                            ? 'bg-red-400/10 text-red-400'
                            : 'bg-amber-400/10 text-amber-400'
                      }`}
                    >
                      {sig.direction}
                    </span>
                    <span className="text-sm font-medium text-zinc-200">{sig.pair}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="font-mono">Skor: {sig.totalScore}</span>
                    <span className="font-mono">Kprcyn: {sig.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Upcoming Economic Events */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <BarChart3 className="h-4 w-4" /> Acara Mendatang
          </h3>
          <div className="space-y-2">
            {upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-3 rounded border border-zinc-800 px-3 py-2"
              >
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <span className="text-[10px] font-mono text-zinc-500">{ev.date.slice(5)}</span>
                  <span className="text-xs font-mono font-medium text-zinc-300">{ev.time}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                      {ev.currency}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${impactColor[ev.impact]}`} title={ev.impact} />
                    <span className="truncate text-sm text-zinc-200">{ev.event}</span>
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px] text-zinc-500">
                    <span>Prks: {ev.forecast || '—'}</span>
                    <span>Sblm: {ev.previous || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Currency Strength */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <BarChart3 className="h-4 w-4" /> Kekuatan Mata Uang
          </h3>
          <div className="space-y-2">
            {currencyStrength.map((cs) => {
              const pct = Math.max(5, Math.min(100, cs.strength));
              const barColor =
                cs.strength >= 60
                  ? 'bg-emerald-500'
                  : cs.strength >= 45
                    ? 'bg-amber-500'
                    : 'bg-red-500';
              return (
                <div key={cs.currency} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-bold text-zinc-300">{cs.currency}</span>
                  <div className="h-2 flex-1 rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-xs text-zinc-400">
                    {cs.strength.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Breaking News */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Newspaper className="h-4 w-4" /> Berita Terkini
          </h3>
          <div className="space-y-3">
            {latestNews.map((item) => (
              <div key={item.id} className="border-b border-zinc-800 pb-2 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-snug text-zinc-200">{item.headline}</p>
                  <span className={`h-2 w-2 shrink-0 mt-1.5 rounded-full ${importanceColor[item.importance]}`} />
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px]">
                  <span className="text-zinc-500">{timeAgo(item.timestamp)}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-medium ${sentimentBadge[item.sentiment] ?? 'text-zinc-400 bg-zinc-400/10'}`}
                  >
                    {item.sentiment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Market Sentiment + 8. AI Market Summary — stacked in one column cell */}
        <div className="space-y-4">
          {/* 7. Market Sentiment */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              <Shield className="h-4 w-4" /> Sentimen Pasar
            </h3>
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold ${
                  marketSentiment === 'Risk On'
                    ? 'text-emerald-400'
                    : marketSentiment === 'Risk Off'
                      ? 'text-red-400'
                      : 'text-amber-400'
                }`}
              >
                {marketSentiment}
              </span>
              {marketSentiment === 'Risk On' ? (
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              ) : marketSentiment === 'Risk Off' ? (
                <TrendingDown className="h-5 w-5 text-red-400" />
              ) : (
                <Activity className="h-5 w-5 text-amber-400" />
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Based on average sentiment across {majorPairs.length} major pairs.
            </p>
          </div>

          {/* 8. AI Market Summary */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              <Brain className="h-4 w-4" /> Ringkasan Pasar AI
            </h3>
            <p className="text-sm leading-relaxed text-zinc-300">
              USD showing strength across major pairs. EUR/USD facing resistance at 1.0880.
              GBP maintaining bullish momentum supported by sticky wage data. JPY weakness
              persists amid yield differential, though BoJ normalization hints cap downside.
              Risk currencies AUD and NZD under pressure from soft China PMI.
            </p>
            <p className="mt-2 text-[10px] text-zinc-600 italic">
              Generated summary — not financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
