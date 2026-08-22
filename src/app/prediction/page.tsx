'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForexStore } from '@/lib/store';
import { generatePrediction } from '@/lib/mock-data';
import type { Prediction } from '@/lib/types';
import {
  Brain,
  Shield,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  ChevronDown,
  Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const decimals = (s: string) => (s.includes('JPY') ? 2 : 4);

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function directionColor(d: string) {
  if (d === 'Bullish') return 'text-emerald-400';
  if (d === 'Bearish') return 'text-red-400';
  return 'text-zinc-400';
}

function directionBg(d: string) {
  if (d === 'Bullish') return 'bg-emerald-400/10 ring-emerald-500/20';
  if (d === 'Bearish') return 'bg-red-400/10 ring-red-500/20';
  return 'bg-zinc-400/10 ring-zinc-500/20';
}

function verdictStyle(v: string) {
  if (v === 'BUY') return 'bg-emerald-500 text-white';
  if (v === 'SELL') return 'bg-red-500 text-white';
  return 'bg-amber-500 text-black';
}

// ---------------------------------------------------------------------------
// Confidence Gauge (horizontal)
// ---------------------------------------------------------------------------

function ConfidenceGauge({ value }: { value: number }) {
  const pct = clamp(value, 0, 100);
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Confidence</span>
        <span className="font-mono font-semibold text-zinc-200">{pct}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Probability Bar
// ---------------------------------------------------------------------------

function ProbBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-zinc-400">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${clamp(pct, 0, 100)}%` }}
        />
      </div>
      <span className="w-10 text-right font-mono text-xs text-zinc-300">
        {pct}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-Horizon Card
// ---------------------------------------------------------------------------

interface HorizonPrediction {
  label: string;
  direction: 'Bullish' | 'Bearish' | 'Neutral';
  bullish: number;
  neutral: number;
  bearish: number;
}

function HorizonCard({ h }: { h: HorizonPrediction }) {
  const Icon =
    h.direction === 'Bullish'
      ? TrendingUp
      : h.direction === 'Bearish'
        ? TrendingDown
        : Minus;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{h.label}</span>
        <div
          className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ring-1 ${directionBg(h.direction)} ${directionColor(h.direction)}`}
        >
          <Icon className="h-3 w-3" />
          {h.direction.toUpperCase()}
        </div>
      </div>
      <div className="space-y-1.5">
        <ProbBar label="Bull" pct={h.bullish} color="bg-emerald-500" />
        <ProbBar label="Neutral" pct={h.neutral} color="bg-zinc-500" />
        <ProbBar label="Bear" pct={h.bearish} color="bg-red-500" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PredictionPage() {
  const pairs = useForexStore((s) => s.pairs);
  const selectedPair = useForexStore((s) => s.selectedPair);
  const setSelectedPair = useForexStore((s) => s.setSelectedPair);
  const predictions = useForexStore((s) => s.predictions);
  const generatePredictions = useForexStore((s) => s.generatePredictions);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    generatePredictions();
  }, [generatePredictions]);

  const prediction = predictions.get(selectedPair);

  // Build multi-horizon predictions by jittering the base
  const horizons: HorizonPrediction[] = useMemo(() => {
    if (!prediction) return [];
    const jitter = (base: number, range: number) =>
      Math.max(0, Math.min(100, Math.round(base + (Math.random() - 0.5) * range)));

    return [
      { label: '15 Menit ke Depan', range: 25 },
      { label: '1 Jam ke Depan', range: 18 },
      { label: '4 Jam ke Depan', range: 12 },
      { label: '24 Jam ke Depan', range: 8 },
    ].map(({ label, range }) => {
      const bull = jitter(prediction.bullishProbability, range);
      const bear = jitter(prediction.bearishProbability, range);
      const neut = Math.max(0, 100 - bull - bear);
      const dir =
        bull > bear + 10 ? 'Bullish' : bear > bull + 10 ? 'Bearish' : 'Neutral';
      return {
        label,
        direction: dir as HorizonPrediction['direction'],
        bullish: bull,
        neutral: neut,
        bearish: bear,
      };
    });
  }, [prediction]);

  if (!prediction) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading predictions...
      </div>
    );
  }

  const d = decimals(selectedPair);
  const DirectionIcon =
    prediction.direction === 'Bullish'
      ? TrendingUp
      : prediction.direction === 'Bearish'
        ? TrendingDown
        : Minus;

  return (
    <div className="space-y-6">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">
          Mesin Prediksi AI
        </span>
      </div>

      {/* Header + Pair Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <Brain className="h-5 w-5 text-purple-400" />
          Mesin Prediksi AI
        </h1>

        {/* Pair dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-600 transition-colors"
          >
            {selectedPair}
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-1 max-h-64 w-40 overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
              {pairs.map((p) => (
                <button
                  key={p.symbol}
                  onClick={() => {
                    setSelectedPair(p.symbol);
                    setDropdownOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors ${
                    p.symbol === selectedPair
                      ? 'text-purple-400 font-semibold'
                      : 'text-zinc-300'
                  }`}
                >
                  {p.symbol}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Main Prediction Panel                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Direction + Probabilities */}
        <div className="lg:col-span-2 space-y-4">
          {/* Direction Banner */}
          <div
            className={`rounded-lg border border-zinc-800 bg-zinc-900 p-6 ring-1 ${directionBg(prediction.direction)}`}
          >
            <div className="flex items-center gap-4">
              <DirectionIcon
                className={`h-12 w-12 ${directionColor(prediction.direction)}`}
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Prediction for {selectedPair}
                </p>
                <p
                  className={`text-4xl font-black tracking-tight ${directionColor(prediction.direction)}`}
                >
                  {prediction.direction.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Badges row */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                <Clock className="h-3 w-3" />
                {prediction.timeHorizon}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                <Activity className="h-3 w-3" />
                {prediction.marketRegime}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                <Target className="h-3 w-3" />
                R:R {prediction.riskReward}
              </span>
            </div>
          </div>

          {/* Probability Bars */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Distribusi Probabilitas
            </h3>
            <ProbBar
              label="Bullish"
              pct={prediction.bullishProbability}
              color="bg-emerald-500"
            />
            <ProbBar
              label="Netral"
              pct={prediction.neutralProbability}
              color="bg-zinc-500"
            />
            <ProbBar
              label="Bearish"
              pct={prediction.bearishProbability}
              color="bg-red-500"
            />
          </div>

          {/* Key Levels */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Level Kunci
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Support', value: prediction.support, color: 'text-emerald-400' },
                { label: 'Resistance', value: prediction.resistance, color: 'text-red-400' },
                { label: 'Target TP', value: prediction.target, color: 'text-purple-400' },
                { label: 'Invalidasi (SL)', value: prediction.invalidation, color: 'text-amber-400' },
              ].map((lv) => (
                <div key={lv.label} className="rounded bg-zinc-800/60 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {lv.label}
                  </p>
                  <p className={`font-mono text-lg font-semibold ${lv.color}`}>
                    {lv.value.toFixed(d)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Confidence + Verdict */}
        <div className="space-y-4">
          {/* Confidence */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <ConfidenceGauge value={prediction.confidence} />
          </div>

          {/* Verdict */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
              Keputusan
            </p>
            <div
              className={`flex items-center justify-center rounded-lg py-6 text-3xl font-black tracking-widest ${verdictStyle(prediction.verdict)}`}
            >
              {prediction.verdict}
            </div>
            <p className="mt-2 text-center text-xs text-zinc-500 font-mono">
              Keyakinan: {prediction.confidence}%
            </p>
          </div>

          {/* Risk/Reward */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Rasio Risiko / Imbalan
            </p>
            <p className="mt-1 font-mono text-4xl font-black text-zinc-100">
              {prediction.riskReward}
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* AI Reasoning                                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Supporting Reasons */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Alasan Pendukung
          </h3>
          <ol className="space-y-2">
            {prediction.reasons.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ol>
        </div>

        {/* Risk Factors */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Faktor Risiko
          </h3>
          <ol className="space-y-2">
            {prediction.riskFactors.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-400">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Multi-Horizon Predictions                                         */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Clock className="h-4 w-4" />
          Prediksi Multi-Horizon Waktu
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {horizons.map((h) => (
            <HorizonCard key={h.label} h={h} />
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Model Information                                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <Info className="h-4 w-4" />
          Informasi Model
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Versi Model</p>
            <p className="font-mono text-zinc-300">{prediction.modelVersion}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Pembaruan Terakhir</p>
            <p className="font-mono text-zinc-300">
              {new Date(prediction.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Sumber Data</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {['Teknikal', 'Fundamental', 'Sentimen', 'Berita'].map((s) => (
                <span
                  key={s}
                  className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Volatilitas</p>
            <p className="font-mono text-zinc-300">
              {prediction.expectedVolatility}
            </p>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-zinc-600 italic">
          Prediksi adalah estimasi probabilistik berdasarkan data yang tersedia. Bukan nasihat keuangan.
        </p>
      </div>
    </div>
  );
}
