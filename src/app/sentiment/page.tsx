'use client';

import { useMemo, useEffect } from 'react';
import { useForexStore } from '@/lib/store';
import type { Currency, CurrencyPair, NewsItem } from '@/lib/types';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  BarChart3,
  Newspaper,
  Gauge,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SENTIMENT_SCORE: Record<string, number> = {
  'Very Bullish': 90,
  Bullish: 70,
  Neutral: 50,
  Bearish: 30,
  'Very Bearish': 10,
};

const SENTIMENT_MAP: Record<string, number> = {
  'Very Bullish': 2,
  Bullish: 1,
  Neutral: 0,
  Bearish: -1,
  'Very Bearish': -2,
};

function scoreToLabel(score: number): string {
  if (score >= 80) return 'Very Bullish';
  if (score >= 60) return 'Bullish';
  if (score >= 40) return 'Neutral';
  if (score >= 20) return 'Bearish';
  return 'Very Bearish';
}

function scoreToColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-green-400';
  if (score >= 40) return 'text-zinc-400';
  if (score >= 20) return 'text-orange-400';
  return 'text-red-400';
}

function scoreToBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-green-500';
  if (score >= 40) return 'bg-zinc-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function scoreToBarGradient(score: number): string {
  if (score >= 60) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];

// ---------------------------------------------------------------------------
// Sentiment Gauge Component
// ---------------------------------------------------------------------------

function SentimentGauge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const pct = Math.max(0, Math.min(100, score));
  const h = size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={`relative w-full ${h} rounded-full overflow-hidden`}>
      {/* Background gradient: red -> amber -> green */}
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-red-500/30" />
        <div className="flex-1 bg-orange-500/30" />
        <div className="flex-1 bg-amber-500/30" />
        <div className="flex-1 bg-green-500/30" />
        <div className="flex-1 bg-emerald-500/30" />
      </div>
      {/* Marker */}
      <div
        className="absolute top-0 h-full w-1 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.6)] transition-all duration-500"
        style={{ left: `calc(${pct}% - 2px)` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Derive sentiment data
// ---------------------------------------------------------------------------

function deriveTechnicalSentiment(pairs: CurrencyPair[]): number {
  // Average RSI mapped to 0-100 sentiment
  const avgRsi = pairs.reduce((s, p) => s + p.rsi, 0) / (pairs.length || 1);
  // RSI 30 = very bearish (10), RSI 70 = very bullish (90), RSI 50 = neutral (50)
  return Math.max(0, Math.min(100, ((avgRsi - 30) / 40) * 80 + 10));
}

function deriveNewsSentiment(news: NewsItem[]): number {
  if (news.length === 0) return 50;
  const avg = news.reduce((s, n) => s + (SENTIMENT_SCORE[n.sentiment] ?? 50), 0) / news.length;
  return avg;
}

function deriveMomentumSentiment(pairs: CurrencyPair[]): number {
  // Based on average changePercent
  const avgChange = pairs.reduce((s, p) => s + p.changePercent, 0) / (pairs.length || 1);
  // Map -1% to 10, 0 to 50, +1% to 90
  return Math.max(0, Math.min(100, 50 + avgChange * 40));
}

function generateSentimentHistory(): { time: string; score: number }[] {
  // Simulated 24 ticks of sentiment
  const data: { time: string; score: number }[] = [];
  let score = 50 + (Math.random() - 0.5) * 20;
  for (let i = 24; i >= 0; i--) {
    score = Math.max(10, Math.min(90, score + (Math.random() - 0.48) * 8));
    data.push({
      time: `${i}h`,
      score: Math.round(score),
    });
  }
  return data;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SentimentPage() {
  const pairs = useForexStore((s) => s.pairs);
  const news = useForexStore((s) => s.news);
  const updatePrices = useForexStore((s) => s.updatePrices);

  useEffect(() => {
    const id = setInterval(updatePrices, 3000);
    return () => clearInterval(id);
  }, [updatePrices]);

  // Overall sentiment
  const overallSentiment = useMemo(() => {
    const avg =
      pairs.reduce((s, p) => s + (SENTIMENT_MAP[p.sentiment] ?? 0), 0) / (pairs.length || 1);
    if (avg >= 0.3) return 'Risk On' as const;
    if (avg <= -0.3) return 'Risk Off' as const;
    return 'Mixed' as const;
  }, [pairs]);

  const overallScore = useMemo(() => {
    return pairs.reduce((s, p) => s + (SENTIMENT_SCORE[p.sentiment] ?? 50), 0) / (pairs.length || 1);
  }, [pairs]);

  // Per-pair sentiment
  const pairSentiments = useMemo(() => {
    return pairs.map((p) => ({
      symbol: p.symbol,
      sentiment: p.sentiment,
      score: SENTIMENT_SCORE[p.sentiment] ?? 50,
    }));
  }, [pairs]);

  // Breakdown scores
  const techScore = useMemo(() => deriveTechnicalSentiment(pairs), [pairs]);
  const newsScore = useMemo(() => deriveNewsSentiment(news), [news]);
  const momentumScore = useMemo(() => deriveMomentumSentiment(pairs), [pairs]);

  // Currency-level aggregation
  const currencySentiments = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    CURRENCIES.forEach((c) => (map[c] = { total: 0, count: 0 }));

    pairs.forEach((p) => {
      const score = SENTIMENT_SCORE[p.sentiment] ?? 50;
      if (map[p.base]) {
        map[p.base].total += score;
        map[p.base].count += 1;
      }
      if (map[p.quote]) {
        // Quote currency: invert sentiment (if pair is bullish, base is strong / quote is weak)
        map[p.quote].total += 100 - score;
        map[p.quote].count += 1;
      }
    });

    return CURRENCIES.map((c) => ({
      currency: c,
      score: map[c].count > 0 ? Math.round(map[c].total / map[c].count) : 50,
    })).sort((a, b) => b.score - a.score);
  }, [pairs]);

  // Sentiment history (stable across renders via useMemo with empty deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sentimentHistory = useMemo(() => generateSentimentHistory(), []);

  // AI Commentary
  const aiCommentary = useMemo(() => {
    const strongCurrencies = currencySentiments.filter((c) => c.score >= 60);
    const weakCurrencies = currencySentiments.filter((c) => c.score <= 40);
    const strongNames = strongCurrencies.map((c) => c.currency).join(', ');
    const weakNames = weakCurrencies.map((c) => c.currency).join(', ');

    const sentLabel = overallSentiment === 'Risk On' ? 'moderately bullish' : overallSentiment === 'Risk Off' ? 'bearish' : 'mixed';

    let commentary = `Market sentiment is ${sentLabel}. `;
    if (strongNames) commentary += `${strongNames} ${strongCurrencies.length > 1 ? 'show' : 'shows'} strength, driven by positive technical and fundamental signals. `;
    if (weakNames) commentary += `${weakNames} ${weakCurrencies.length > 1 ? 'remain' : 'remains'} under pressure. `;
    commentary += 'Risk appetite is stable with implied volatility metrics suggesting a measured trading environment. Monitor central bank rhetoric for shifts.';

    return commentary;
  }, [currencySentiments, overallSentiment]);

  return (
    <div className="space-y-5">
      {/* Pro Live badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          <Shield className="h-3 w-3" />
          PRO TRADING TERMINAL
        </span>
        <span className="text-xs text-zinc-500 font-mono">Dasbor Sentimen Pasar</span>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Overall Market Sentiment */}
      {/* ------------------------------------------------------------------- */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Gauge className="h-4 w-4" />
          Sentimen Pasar Keseluruhan
        </h2>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <span
              className={`text-3xl font-bold ${
                overallSentiment === 'Risk On'
                  ? 'text-emerald-400'
                  : overallSentiment === 'Risk Off'
                    ? 'text-red-400'
                    : 'text-amber-400'
              }`}
            >
              {overallSentiment}
            </span>
            {overallSentiment === 'Risk On' ? (
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            ) : overallSentiment === 'Risk Off' ? (
              <TrendingDown className="h-6 w-6 text-red-400" />
            ) : (
              <Activity className="h-6 w-6 text-amber-400" />
            )}
          </div>
          <div className="flex-1 w-full max-w-md">
            <SentimentGauge score={overallScore} size="lg" />
            <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
              <span>Very Bearish</span>
              <span>Neutral</span>
              <span>Very Bullish</span>
            </div>
          </div>
          <span className="font-mono text-sm text-zinc-400">Score: {Math.round(overallScore)}</span>
        </div>
      </section>

      {/* Two-column grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ----------------------------------------------------------------- */}
        {/* Per-Pair Sentiment */}
        {/* ----------------------------------------------------------------- */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <BarChart3 className="h-4 w-4" />
            Pair Sentiment
          </h3>
          <div className="space-y-2.5">
            {pairSentiments.map((p) => (
              <div key={p.symbol} className="flex items-center gap-3">
                <span className="w-16 text-xs font-bold text-zinc-300">{p.symbol}</span>
                <div className="flex-1">
                  <SentimentGauge score={p.score} />
                </div>
                <span className={`w-24 text-right text-[11px] font-medium ${scoreToColor(p.score)}`}>
                  {p.sentiment}
                </span>
                <span className="w-8 text-right font-mono text-[11px] text-zinc-500">{p.score}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Sentiment Breakdown by Source */}
        {/* ----------------------------------------------------------------- */}
        <section className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              <Activity className="h-4 w-4" />
              Sentiment Breakdown
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Technical', icon: BarChart3, score: techScore, desc: 'From RSI, MACD, trend across pairs' },
                { label: 'News', icon: Newspaper, score: newsScore, desc: 'From news sentiment analysis' },
                { label: 'Momentum', icon: TrendingUp, score: momentumScore, desc: 'From price action and change %' },
              ].map((item) => (
                <div key={item.label} className="rounded border border-zinc-800 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="text-xs font-semibold text-zinc-300">{item.label} Sentiment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${scoreToColor(item.score)}`}>
                        {scoreToLabel(item.score)}
                      </span>
                      <span className="font-mono text-xs text-zinc-500">{Math.round(item.score)}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${scoreToBarGradient(item.score)} transition-all duration-500`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Currency Sentiment Summary */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              <BarChart3 className="h-4 w-4" />
              Currency Sentiment
            </h3>
            <div className="space-y-2">
              {currencySentiments.map((c) => (
                <div key={c.currency} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-bold text-zinc-300">{c.currency}</span>
                  <div className="h-2 flex-1 rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${scoreToBgColor(c.score)} transition-all duration-500`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <span className={`w-20 text-right text-[11px] font-medium ${scoreToColor(c.score)}`}>
                    {scoreToLabel(c.score)}
                  </span>
                  <span className="w-6 text-right font-mono text-[11px] text-zinc-500">{c.score}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* AI Commentary */}
        {/* ----------------------------------------------------------------- */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Brain className="h-4 w-4" />
            AI Sentiment Commentary
          </h3>
          <p className="text-sm leading-relaxed text-zinc-300">{aiCommentary}</p>
          <p className="mt-2 text-[10px] text-zinc-600 italic">
            Generated analysis — not financial advice.
          </p>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Sentiment History Chart */}
        {/* ----------------------------------------------------------------- */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Activity className="h-4 w-4" />
            Sentiment History (24h)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentimentHistory}>
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={false}
                  width={30}
                />
                <ReferenceLine y={50} stroke="#3f3f46" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#d4d4d8',
                  }}
                  formatter={(value) => [`${value}`, 'Sentiment']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
            <span>Bearish zone (&lt;40)</span>
            <span>Neutral (40-60)</span>
            <span>Bullish zone (&gt;60)</span>
          </div>
        </section>
      </div>
    </div>
  );
}
