'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForexStore } from '@/lib/store';
import type { Signal } from '@/lib/types';
import {
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const decimals = (s: string) => (s.includes('JPY') ? 2 : 4);

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function dirBadge(d: string) {
  if (d === 'BUY')
    return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
  if (d === 'SELL') return 'bg-red-500/10 text-red-400 ring-red-500/20';
  return 'bg-amber-500/10 text-amber-400 ring-amber-500/20';
}

function scoreColor(pct: number) {
  if (pct >= 70) return 'text-emerald-400';
  if (pct >= 45) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(pct: number) {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 45) return 'bg-amber-500';
  return 'bg-red-500';
}

// ---------------------------------------------------------------------------
// Score bar (mini)
// ---------------------------------------------------------------------------

function ScoreBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-[11px] text-zinc-500 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${scoreBg(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right font-mono text-[11px] text-zinc-400">
        {value}/{max}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confidence gauge (compact)
// ---------------------------------------------------------------------------

function MiniGauge({ value }: { value: number }) {
  const pct = clamp(value, 0, 100);
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-0.5">
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right font-mono text-[10px] text-zinc-500">
        {pct}%
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Consensus row
// ---------------------------------------------------------------------------

function ConsensusRow({
  label,
  value,
}: {
  label: string;
  value: 'Bullish' | 'Bearish' | 'Neutral';
}) {
  const color =
    value === 'Bullish'
      ? 'text-emerald-400'
      : value === 'Bearish'
        ? 'text-red-400'
        : 'text-zinc-400';
  const Icon =
    value === 'Bullish'
      ? TrendingUp
      : value === 'Bearish'
        ? TrendingDown
        : Minus;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
        <Icon className="h-3 w-3" />
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal Card
// ---------------------------------------------------------------------------

function SignalCard({
  signal,
  rank,
  isTop,
  expanded,
  onToggle,
}: {
  signal: Signal;
  rank: number;
  isTop: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const d = decimals(signal.pair);
  const weights = { technical: 30, fundamental: 25, sentiment: 15, marketStructure: 15, volatility: 10, news: 5 };

  // Derive weighted total out of 100
  const weightedTotal = Math.round(
    (signal.technicalScore / 100) * weights.technical +
    (signal.fundamentalScore / 100) * weights.fundamental +
    (signal.sentimentScore / 100) * weights.sentiment +
    (signal.marketStructureScore / 100) * weights.marketStructure +
    (signal.volatilityScore / 100) * weights.volatility +
    (signal.newsScore / 100) * weights.news
  );

  return (
    <div
      className={`rounded-lg border bg-zinc-900 p-4 transition-colors ${
        isTop
          ? 'border-purple-500/50 ring-1 ring-purple-500/20'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
            {rank}
          </span>
          <span className="text-sm font-semibold text-zinc-100">
            {signal.pair}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold ring-1 ${dirBadge(signal.direction)}`}
          >
            {signal.direction}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-xl font-black ${scoreColor(weightedTotal)}`}
          >
            {weightedTotal}
          </span>
          <span className="text-[10px] text-zinc-600">/100</span>
          <button
            onClick={onToggle}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Entry', value: signal.entry.toFixed(d) },
          { label: 'Stop Loss', value: signal.stopLoss.toFixed(d), color: 'text-red-400' },
          { label: 'Take Profit', value: signal.takeProfit.toFixed(d), color: 'text-emerald-400' },
          { label: 'R:R', value: signal.riskReward.toFixed(2) },
        ].map((item) => (
          <div key={item.label} className="rounded bg-zinc-800/60 px-2 py-1.5">
            <p className="text-[10px] uppercase text-zinc-500">{item.label}</p>
            <p className={`font-mono text-sm font-semibold ${item.color ?? 'text-zinc-200'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Confidence */}
      <div className="mt-3">
        <MiniGauge value={signal.confidence} />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 space-y-4 border-t border-zinc-800 pt-4">
          {/* Score breakdown */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">
              Score Breakdown
            </h4>
            <ScoreBar label="Technical" value={Math.round((signal.technicalScore / 100) * weights.technical)} max={weights.technical} />
            <ScoreBar label="Fundamental" value={Math.round((signal.fundamentalScore / 100) * weights.fundamental)} max={weights.fundamental} />
            <ScoreBar label="Sentiment" value={Math.round((signal.sentimentScore / 100) * weights.sentiment)} max={weights.sentiment} />
            <ScoreBar label="Struktur Pasar" value={Math.round((signal.marketStructureScore / 100) * weights.marketStructure)} max={weights.marketStructure} />
            <ScoreBar label="Volatilitas" value={Math.round((signal.volatilityScore / 100) * weights.volatility)} max={weights.volatility} />
            <ScoreBar label="Berita" value={Math.round((signal.newsScore / 100) * weights.news)} max={weights.news} />
          </div>

          {/* Reasoning */}
          <div>
            <h4 className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
              Alasan Analisis
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {signal.reasoning}
            </p>
          </div>

          {/* Timestamp */}
          <p className="text-[10px] text-zinc-600 font-mono">
            Dibuat: {new Date(signal.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SignalsPage() {
  const signals = useForexStore((s) => s.signals);
  const refreshSignals = useForexStore((s) => s.refreshSignals);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    refreshSignals();
  }, [refreshSignals]);

  // Sort by totalScore descending
  const sorted = useMemo(
    () => [...signals].sort((a, b) => b.totalScore - a.totalScore),
    [signals],
  );

  const topSignal = sorted[0];

  // Overview stats
  const totalCount = sorted.length;
  const buyCount = sorted.filter((s) => s.direction === 'BUY').length;
  const sellCount = sorted.filter((s) => s.direction === 'SELL').length;
  const waitCount = sorted.filter((s) => s.direction === 'WAIT').length;
  const avgConfidence =
    totalCount > 0
      ? Math.round(sorted.reduce((sum, s) => sum + s.confidence, 0) / totalCount)
      : 0;

  // Derive consensus from top signal
  function toConsensus(score: number): 'Bullish' | 'Bearish' | 'Neutral' {
    if (score >= 60) return 'Bullish';
    if (score <= 40) return 'Bearish';
    return 'Neutral';
  }

  return (
    <div className="space-y-6">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Mesin Sinyal Forex</span>
      </div>

      <h1 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
        <Zap className="h-5 w-5 text-amber-400" />
        Mesin Sinyal Forex
      </h1>

      {/* ----------------------------------------------------------------- */}
      {/* Signal Overview                                                   */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total Sinyal', value: totalCount.toString(), color: 'text-zinc-100' },
          { label: 'Beli (Buy)', value: buyCount.toString(), color: 'text-emerald-400' },
          { label: 'Jual (Sell)', value: sellCount.toString(), color: 'text-red-400' },
          { label: 'Tunggu (Wait)', value: waitCount.toString(), color: 'text-amber-400' },
          { label: 'Rata-rata Keyakinan', value: `${avgConfidence}%`, color: 'text-purple-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              {stat.label}
            </p>
            <p className={`mt-1 font-mono text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ----------------------------------------------------------------- */}
        {/* Signal Cards                                                     */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            All Signals
          </h2>
          {sorted.length === 0 ? (
            <p className="text-sm text-zinc-500">No signals generated yet.</p>
          ) : (
            sorted.map((sig, i) => (
              <SignalCard
                key={sig.id}
                signal={sig}
                rank={i + 1}
                isTop={i === 0}
                expanded={expandedId === sig.id}
                onToggle={() =>
                  setExpandedId(expandedId === sig.id ? null : sig.id)
                }
              />
            ))
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Right sidebar: Consensus + Methodology                           */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Consensus Engine */}
          {topSignal && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Consensus Engine
              </h3>
              <p className="mb-3 text-[10px] text-zinc-600">
                Based on top signal: {topSignal.pair}
              </p>
              <div>
                <ConsensusRow
                  label="Technical"
                  value={toConsensus(topSignal.technicalScore)}
                />
                <ConsensusRow
                  label="Fundamental"
                  value={toConsensus(topSignal.fundamentalScore)}
                />
                <ConsensusRow
                  label="Sentiment"
                  value={toConsensus(topSignal.sentimentScore)}
                />
                <ConsensusRow
                  label="News"
                  value={toConsensus(topSignal.newsScore)}
                />
                <ConsensusRow
                  label="Market Structure"
                  value={toConsensus(topSignal.marketStructureScore)}
                />
                <ConsensusRow
                  label="ML Model"
                  value={toConsensus(topSignal.totalScore)}
                />
              </div>
              {/* Overall consensus */}
              <div className="mt-4 rounded-lg bg-zinc-800/60 p-3 text-center">
                <p className="text-[10px] uppercase text-zinc-500">Consensus</p>
                {(() => {
                  const c = toConsensus(topSignal.totalScore);
                  const color =
                    c === 'Bullish'
                      ? 'text-emerald-400'
                      : c === 'Bearish'
                        ? 'text-red-400'
                        : 'text-zinc-400';
                  return (
                    <p className={`mt-1 text-xl font-black ${color}`}>
                      {c.toUpperCase()}
                    </p>
                  );
                })()}
                <p className="mt-0.5 font-mono text-xs text-zinc-500">
                  Confidence: {topSignal.confidence}%
                </p>
              </div>
            </div>
          )}

          {/* Scoring Methodology */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <Info className="h-4 w-4" />
              Scoring Methodology
            </h3>
            <div className="space-y-2 text-xs text-zinc-400">
              {[
                { label: 'Technical Analysis', weight: '30%', desc: 'RSI, MACD, EMA, price action' },
                { label: 'Fundamental', weight: '25%', desc: 'Economic data, rate differentials' },
                { label: 'Sentiment', weight: '15%', desc: 'Market positioning, COT data' },
                { label: 'Market Structure', weight: '15%', desc: 'Support/resistance, order flow' },
                { label: 'Volatility', weight: '10%', desc: 'ATR, implied vol, regime' },
                { label: 'News Impact', weight: '5%', desc: 'Breaking news, event proximity' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-2 rounded bg-zinc-800/40 px-2 py-1.5"
                >
                  <span className="shrink-0 font-mono font-semibold text-zinc-300 w-8">
                    {item.weight}
                  </span>
                  <div>
                    <p className="text-zinc-300 font-medium">{item.label}</p>
                    <p className="text-[10px] text-zinc-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-zinc-600 italic">
              Scores are normalized 0-100. Total is weighted sum across all
              dimensions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
