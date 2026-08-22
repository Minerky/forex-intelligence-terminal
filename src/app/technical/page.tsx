'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForexStore } from '@/lib/store';
import { generateTimeframeAnalysis } from '@/lib/mock-data';
import type { CurrencyPair, TechnicalIndicators } from '@/lib/types';
import {
  Shield,
  LineChart,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Brain,
  Layers,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decimalsFor(symbol: string): number {
  return symbol.includes('JPY') ? 2 : 4;
}

function roundTo(v: number, d: number): number {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ---------------------------------------------------------------------------
// Generate realistic technical indicators from pair data
// ---------------------------------------------------------------------------

function generateIndicators(pair: CurrencyPair): TechnicalIndicators {
  const d = decimalsFor(pair.symbol);
  const pip = pair.symbol.includes('JPY') ? 0.01 : 0.0001;
  const price = pair.price;
  const atr = pair.atr;
  const rsi = pair.rsi;

  // MAs: scatter around price. Higher TF MAs further from price in trend direction
  const trendSign = pair.trend === 'Bullish' ? 1 : pair.trend === 'Bearish' ? -1 : 0;
  const ema9 = roundTo(price - trendSign * atr * rand(0.02, 0.08), d);
  const ema20 = roundTo(price - trendSign * atr * rand(0.05, 0.15), d);
  const ema50 = roundTo(price - trendSign * atr * rand(0.15, 0.35), d);
  const ema100 = roundTo(price - trendSign * atr * rand(0.30, 0.60), d);
  const ema200 = roundTo(price - trendSign * atr * rand(0.50, 1.00), d);
  const sma20 = roundTo(ema20 + (Math.random() - 0.5) * atr * 0.05, d);
  const sma50 = roundTo(ema50 + (Math.random() - 0.5) * atr * 0.08, d);
  const sma200 = roundTo(ema200 + (Math.random() - 0.5) * atr * 0.1, d);

  const stochK = roundTo(clamp(rsi + rand(-10, 10), 5, 95), 1);
  const stochD = roundTo(clamp(stochK + rand(-5, 5), 5, 95), 1);
  const adx = roundTo(clamp(20 + Math.abs(rsi - 50) * 0.6 + rand(-5, 5), 10, 80), 1);
  const cci = roundTo((rsi - 50) * 3 + rand(-30, 30), 1);
  const williamsR = roundTo(-(100 - rsi) + rand(-8, 8), 1);

  const bbMiddle = sma20;
  const bbWidth = atr * rand(1.5, 2.5);
  const bbUpper = roundTo(bbMiddle + bbWidth / 2, d);
  const bbLower = roundTo(bbMiddle - bbWidth / 2, d);

  const tenkan = roundTo(price + (Math.random() - 0.5) * atr * 0.15, d);
  const kijun = roundTo(price - trendSign * atr * rand(0.05, 0.2), d);
  const senkouA = roundTo((tenkan + kijun) / 2, d);
  const senkouB = roundTo(price - trendSign * atr * rand(0.2, 0.5), d);

  const parabolicSar = roundTo(
    pair.trend === 'Bullish'
      ? price - atr * rand(0.3, 0.8)
      : price + atr * rand(0.3, 0.8),
    d,
  );

  const pivot = roundTo((pair.high + pair.low + pair.previousClose) / 3, d);
  const r1 = roundTo(2 * pivot - pair.low, d);
  const s1 = roundTo(2 * pivot - pair.high, d);
  const r2 = roundTo(pivot + (pair.high - pair.low), d);
  const s2 = roundTo(pivot - (pair.high - pair.low), d);
  const r3 = roundTo(pair.high + 2 * (pivot - pair.low), d);
  const s3 = roundTo(pair.low - 2 * (pair.high - pivot), d);

  return {
    ema9, ema20, ema50, ema100, ema200,
    sma20, sma50, sma200,
    rsi,
    macd: pair.macd,
    stochastic: { k: stochK, d: stochD },
    adx,
    atr: pair.atr,
    cci,
    williamsR,
    bollingerBands: { upper: bbUpper, middle: roundTo(bbMiddle, d), lower: bbLower },
    ichimoku: { tenkan, kijun, senkouA, senkouB },
    parabolicSar,
    pivotPoints: { pivot, r1, r2, r3, s1, s2, s3 },
  };
}

// ---------------------------------------------------------------------------
// Signal logic per indicator
// ---------------------------------------------------------------------------

type IndSignal = 'Buy' | 'Sell' | 'Neutral';

function maSignal(price: number, ma: number): IndSignal {
  return price > ma ? 'Buy' : price < ma ? 'Sell' : 'Neutral';
}

function rsiSignal(rsi: number): IndSignal {
  if (rsi > 60) return 'Buy';
  if (rsi < 40) return 'Sell';
  return 'Neutral';
}

function macdSignal(macd: { value: number; signal: number; histogram: number }): IndSignal {
  if (macd.histogram > 0 && macd.value > macd.signal) return 'Buy';
  if (macd.histogram < 0 && macd.value < macd.signal) return 'Sell';
  return 'Neutral';
}

function stochSignal(k: number, d: number): IndSignal {
  if (k > 80 && d > 80) return 'Sell';
  if (k < 20 && d < 20) return 'Buy';
  if (k > d) return 'Buy';
  if (k < d) return 'Sell';
  return 'Neutral';
}

function adxSignal(adx: number): IndSignal {
  return adx > 25 ? 'Buy' : 'Neutral';
}

function cciSignal(cci: number): IndSignal {
  if (cci > 100) return 'Buy';
  if (cci < -100) return 'Sell';
  return 'Neutral';
}

function williamsSignal(wr: number): IndSignal {
  if (wr > -20) return 'Sell';
  if (wr < -80) return 'Buy';
  return 'Neutral';
}

const signalColor: Record<IndSignal, string> = {
  Buy: 'text-emerald-400 bg-emerald-400/10',
  Sell: 'text-red-400 bg-red-400/10',
  Neutral: 'text-zinc-400 bg-zinc-400/10',
};

const signalIcon: Record<IndSignal, typeof TrendingUp> = {
  Buy: TrendingUp,
  Sell: TrendingDown,
  Neutral: Minus,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function IndicatorCard({
  name,
  value,
  signal,
  sub,
}: {
  name: string;
  value: string;
  signal: IndSignal;
  sub?: string;
}) {
  const Icon = signalIcon[signal];
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{name}</span>
        <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${signalColor[signal]}`}>
          <Icon className="h-3 w-3" />
          {signal}
        </span>
      </div>
      <div className="font-mono text-sm font-semibold text-zinc-100">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}

function RsiGauge({ value }: { value: number }) {
  const angle = (value / 100) * 180 - 90;
  const color = value > 70 ? '#f87171' : value < 30 ? '#34d399' : value > 60 ? '#34d399' : value < 40 ? '#f87171' : '#a1a1aa';
  return (
    <div className="flex flex-col items-center">
      <svg width={80} height={48} viewBox="0 0 80 48">
        <path d="M 8 44 A 32 32 0 0 1 72 44" fill="none" stroke="#27272a" strokeWidth={6} strokeLinecap="round" />
        <path
          d="M 8 44 A 32 32 0 0 1 72 44"
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 100.5} 100.5`}
        />
        <line
          x1={40}
          y1={44}
          x2={40 + 24 * Math.cos((angle * Math.PI) / 180)}
          y2={44 + 24 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
      <span className="font-mono text-sm font-bold" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeframe table
// ---------------------------------------------------------------------------

const TF_LABELS: Record<string, string> = {
  M1: '1m', M5: '5m', M15: '15m', M30: '30m',
  H1: '1H', H4: '4H', D1: 'Daily', W1: 'Weekly', MN: 'Monthly',
};

const trendColor: Record<string, string> = {
  Bullish: 'text-emerald-400',
  Bearish: 'text-red-400',
  Neutral: 'text-zinc-400',
};

const signalBadge: Record<string, string> = {
  Buy: 'text-emerald-400 bg-emerald-400/10',
  Sell: 'text-red-400 bg-red-400/10',
  Hold: 'text-zinc-400 bg-zinc-400/10',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TechnicalAnalysisPage() {
  const pairs = useForexStore((s) => s.pairs);
  const selectedPair = useForexStore((s) => s.selectedPair);
  const setSelectedPair = useForexStore((s) => s.setSelectedPair);
  const updatePrices = useForexStore((s) => s.updatePrices);

  useEffect(() => {
    const id = setInterval(updatePrices, 2000);
    return () => clearInterval(id);
  }, [updatePrices]);

  const pair = pairs.find((p) => p.symbol === selectedPair) ?? pairs[0];
  const d = decimalsFor(pair.symbol);

  // Memoize indicators and timeframe analysis (recalculate on pair change)
  const indicators = useMemo(() => generateIndicators(pair), [pair.symbol, pair.price]);
  const tfAnalysis = useMemo(() => generateTimeframeAnalysis(pair.symbol), [pair.symbol]);

  // Collect all signals for summary
  const allSignals: { name: string; signal: IndSignal }[] = [
    { name: 'EMA 9', signal: maSignal(pair.price, indicators.ema9) },
    { name: 'EMA 20', signal: maSignal(pair.price, indicators.ema20) },
    { name: 'EMA 50', signal: maSignal(pair.price, indicators.ema50) },
    { name: 'EMA 100', signal: maSignal(pair.price, indicators.ema100) },
    { name: 'EMA 200', signal: maSignal(pair.price, indicators.ema200) },
    { name: 'SMA 20', signal: maSignal(pair.price, indicators.sma20) },
    { name: 'SMA 50', signal: maSignal(pair.price, indicators.sma50) },
    { name: 'SMA 200', signal: maSignal(pair.price, indicators.sma200) },
    { name: 'RSI', signal: rsiSignal(indicators.rsi) },
    { name: 'MACD', signal: macdSignal(indicators.macd) },
    { name: 'Stochastic', signal: stochSignal(indicators.stochastic.k, indicators.stochastic.d) },
    { name: 'ADX', signal: adxSignal(indicators.adx) },
    { name: 'CCI', signal: cciSignal(indicators.cci) },
    { name: 'Williams %R', signal: williamsSignal(indicators.williamsR) },
  ];

  const buys = allSignals.filter((s) => s.signal === 'Buy').length;
  const sells = allSignals.filter((s) => s.signal === 'Sell').length;
  const neutrals = allSignals.filter((s) => s.signal === 'Neutral').length;
  const overall: IndSignal = buys > sells + 2 ? 'Buy' : sells > buys + 2 ? 'Sell' : 'Neutral';
  const OverallIcon = signalIcon[overall];

  // MTF conclusion
  const bullishTFs = tfAnalysis.filter((t) => t.trend === 'Bullish').length;
  const bearishTFs = tfAnalysis.filter((t) => t.trend === 'Bearish').length;
  const intradayTFs = tfAnalysis.slice(0, 5);
  const intradayBullish = intradayTFs.filter((t) => t.trend === 'Bullish').length;
  const dailyTrend = tfAnalysis.find((t) => t.timeframe === 'D1')?.trend ?? 'Neutral';
  const h4Momentum = tfAnalysis.find((t) => t.timeframe === 'H4')?.momentum ?? 'Moderate';
  const overallBias = bullishTFs > bearishTFs ? 'Bullish' : bearishTFs > bullishTFs ? 'Bearish' : 'Neutral';

  const conclusion = `Pasar menunjukkan keselarasan ${intradayBullish >= 3 ? 'bullish' : intradayBullish <= 1 ? 'bearish' : 'campuran'} pada kerangka waktu intraday (1m-1H). 4H menunjukkan momentum ${h4Momentum === 'Strong' ? 'kuat' : h4Momentum === 'Weak' ? 'lemah' : 'sedang'}. Tren harian tetap ${dailyTrend.toLowerCase()}. Bias keseluruhan: ${overallBias} ${h4Momentum === 'Weak' ? 'dengan kewaspadaan divergensi momentum' : h4Momentum === 'Strong' ? 'dengan konfirmasi momentum kuat' : 'dengan momentum moderat'}.`;

  return (
    <div className="space-y-6">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Analisis Teknikal</span>
      </div>

      {/* Pair selector */}
      <div className="flex items-center gap-4">
        <select
          value={pair.symbol}
          onChange={(e) => setSelectedPair(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {pairs.map((p) => (
            <option key={p.symbol} value={p.symbol}>{p.symbol}</option>
          ))}
        </select>
        <div className="font-mono text-xl font-bold text-zinc-100">
          {pair.price.toFixed(d)}
        </div>
        <span className={`font-mono text-sm ${pair.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {pair.changePercent >= 0 ? '+' : ''}{pair.changePercent.toFixed(2)}%
        </span>
      </div>

      {/* ================================================================= */}
      {/* Section A: Technical Indicators                                   */}
      {/* ================================================================= */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <LineChart className="h-4 w-4" /> Indikator Teknikal
        </h2>

        {/* Summary bar */}
        <div className="mb-4 flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <div className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-bold ${signalColor[overall]}`}>
            <OverallIcon className="h-4 w-4" />
            Overall: {overall}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="h-3 w-3" /> {buys} Buy
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <TrendingDown className="h-3 w-3" /> {sells} Sell
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Minus className="h-3 w-3" /> {neutrals} Neutral
            </span>
          </div>
          {/* Visual bar */}
          <div className="ml-auto flex h-2 w-40 overflow-hidden rounded-full">
            <div className="bg-emerald-500" style={{ width: `${(buys / allSignals.length) * 100}%` }} />
            <div className="bg-zinc-500" style={{ width: `${(neutrals / allSignals.length) * 100}%` }} />
            <div className="bg-red-500" style={{ width: `${(sells / allSignals.length) * 100}%` }} />
          </div>
        </div>

        {/* Moving Averages */}
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Rata-rata Bergerak</h3>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {[
            { name: 'EMA 9', val: indicators.ema9 },
            { name: 'EMA 20', val: indicators.ema20 },
            { name: 'EMA 50', val: indicators.ema50 },
            { name: 'EMA 100', val: indicators.ema100 },
            { name: 'EMA 200', val: indicators.ema200 },
            { name: 'SMA 20', val: indicators.sma20 },
            { name: 'SMA 50', val: indicators.sma50 },
            { name: 'SMA 200', val: indicators.sma200 },
          ].map((ma) => (
            <IndicatorCard
              key={ma.name}
              name={ma.name}
              value={ma.val.toFixed(d)}
              signal={maSignal(pair.price, ma.val)}
              sub={`Price ${pair.price > ma.val ? 'above' : 'below'}`}
            />
          ))}
        </div>

        {/* Oscillators */}
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Osilator</h3>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {/* RSI with gauge */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-zinc-500">RSI (14)</span>
              <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${signalColor[rsiSignal(indicators.rsi)]}`}>
                {rsiSignal(indicators.rsi)}
              </span>
            </div>
            <RsiGauge value={indicators.rsi} />
          </div>

          {/* MACD */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-zinc-500">MACD</span>
              <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${signalColor[macdSignal(indicators.macd)]}`}>
                {macdSignal(indicators.macd)}
              </span>
            </div>
            <div className="space-y-0.5 font-mono text-xs text-zinc-300">
              <div>Nilai: <span className="text-zinc-100">{indicators.macd.value.toFixed(d + 1)}</span></div>
              <div>Sinyal: <span className="text-zinc-100">{indicators.macd.signal.toFixed(d + 1)}</span></div>
              <div>
                Hist:{' '}
                <span className={indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {indicators.macd.histogram >= 0 ? '+' : ''}{indicators.macd.histogram.toFixed(d + 1)}
                </span>
              </div>
            </div>
          </div>

          <IndicatorCard
            name="Stochastic"
            value={`K: ${indicators.stochastic.k.toFixed(1)} / D: ${indicators.stochastic.d.toFixed(1)}`}
            signal={stochSignal(indicators.stochastic.k, indicators.stochastic.d)}
          />
          <IndicatorCard name="ADX" value={indicators.adx.toFixed(1)} signal={adxSignal(indicators.adx)} sub={indicators.adx > 25 ? 'Trending' : 'Ranging'} />
          <IndicatorCard name="CCI" value={indicators.cci.toFixed(1)} signal={cciSignal(indicators.cci)} />
          <IndicatorCard name="Williams %R" value={indicators.williamsR.toFixed(1)} signal={williamsSignal(indicators.williamsR)} />
        </div>

        {/* Volatility */}
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Volatilitas</h3>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <IndicatorCard name="ATR (14)" value={indicators.atr.toFixed(d)} signal="Neutral" sub={`Volatilitas ${pair.volatility === 'High' ? 'Tinggi' : pair.volatility === 'Low' ? 'Rendah' : 'Sedang'}`} />
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
            <div className="mb-1 text-xs text-zinc-500">Bollinger Bands</div>
            <div className="space-y-0.5 font-mono text-xs text-zinc-300">
              <div>Upper: <span className="text-zinc-100">{indicators.bollingerBands.upper.toFixed(d)}</span></div>
              <div>Middle: <span className="text-zinc-100">{indicators.bollingerBands.middle.toFixed(d)}</span></div>
              <div>Lower: <span className="text-zinc-100">{indicators.bollingerBands.lower.toFixed(d)}</span></div>
            </div>
            <div className="mt-1 text-[10px] text-zinc-500">
              Harga {pair.price > indicators.bollingerBands.middle ? 'di atas' : 'di bawah'} middle band
            </div>
          </div>
        </div>

        {/* Other: Ichimoku, SAR, Pivots */}
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Lainnya</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* Ichimoku */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
            <div className="mb-1 text-xs text-zinc-500">Ichimoku Cloud</div>
            <div className="space-y-0.5 font-mono text-xs text-zinc-300">
              <div>Tenkan: <span className="text-zinc-100">{indicators.ichimoku.tenkan.toFixed(d)}</span></div>
              <div>Kijun: <span className="text-zinc-100">{indicators.ichimoku.kijun.toFixed(d)}</span></div>
              <div>Senkou A: <span className="text-zinc-100">{indicators.ichimoku.senkouA.toFixed(d)}</span></div>
              <div>Senkou B: <span className="text-zinc-100">{indicators.ichimoku.senkouB.toFixed(d)}</span></div>
            </div>
            <div className="mt-1 text-[10px] text-zinc-500">
              {pair.price > indicators.ichimoku.senkouA && pair.price > indicators.ichimoku.senkouB
                ? 'Harga di atas cloud — Bullish'
                : pair.price < indicators.ichimoku.senkouA && pair.price < indicators.ichimoku.senkouB
                  ? 'Harga di bawah cloud — Bearish'
                  : 'Harga di dalam cloud — Netral'}
            </div>
          </div>

          {/* Parabolic SAR */}
          <IndicatorCard
            name="Parabolic SAR"
            value={indicators.parabolicSar.toFixed(d)}
            signal={pair.price > indicators.parabolicSar ? 'Buy' : 'Sell'}
            sub={pair.price > indicators.parabolicSar ? 'SAR di bawah harga (Bullish)' : 'SAR di atas harga (Bearish)'}
          />

          {/* Pivot Points */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
            <div className="mb-1 text-xs text-zinc-500">Pivot Points</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-xs">
              <div className="text-red-400">R3: {indicators.pivotPoints.r3.toFixed(d)}</div>
              <div className="text-emerald-400">S1: {indicators.pivotPoints.s1.toFixed(d)}</div>
              <div className="text-red-400">R2: {indicators.pivotPoints.r2.toFixed(d)}</div>
              <div className="text-emerald-400">S2: {indicators.pivotPoints.s2.toFixed(d)}</div>
              <div className="text-red-400">R1: {indicators.pivotPoints.r1.toFixed(d)}</div>
              <div className="text-emerald-400">S3: {indicators.pivotPoints.s3.toFixed(d)}</div>
              <div className="col-span-2 text-zinc-300">P: {indicators.pivotPoints.pivot.toFixed(d)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Section B: Multi-Timeframe Analysis                               */}
      {/* ================================================================= */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Layers className="h-4 w-4" /> Analisis Multi-Kerangka Waktu
        </h2>

        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2">Kerangka Waktu</th>
                <th className="px-3 py-2">Tren</th>
                <th className="px-3 py-2">Momentum</th>
                <th className="px-3 py-2">Volatilitas</th>
                <th className="px-3 py-2 text-right">RSI</th>
                <th className="px-3 py-2">MACD</th>
                <th className="px-3 py-2 text-right">Support</th>
                <th className="px-3 py-2 text-right">Resistance</th>
                <th className="px-3 py-2">Sinyal</th>
                <th className="px-3 py-2 text-right">Keyakinan</th>
              </tr>
            </thead>
            <tbody>
              {tfAnalysis.map((tf) => (
                <tr key={tf.timeframe} className="border-b border-zinc-800/50 bg-zinc-900 hover:bg-zinc-800/40">
                  <td className="px-3 py-2 font-mono font-bold text-zinc-200">{TF_LABELS[tf.timeframe] ?? tf.timeframe}</td>
                  <td className={`px-3 py-2 font-medium ${trendColor[tf.trend]}`}>{tf.trend}</td>
                  <td className="px-3 py-2 text-zinc-300">{tf.momentum === 'Strong' ? 'Kuat' : tf.momentum === 'Weak' ? 'Lemah' : 'Sedang'}</td>
                  <td className="px-3 py-2 text-zinc-300">{tf.volatility === 'High' ? 'Tinggi' : tf.volatility === 'Low' ? 'Rendah' : 'Sedang'}</td>
                  <td className={`px-3 py-2 text-right font-mono ${tf.rsi > 60 ? 'text-emerald-400' : tf.rsi < 40 ? 'text-red-400' : 'text-zinc-300'}`}>
                    {tf.rsi.toFixed(1)}
                  </td>
                  <td className={`px-3 py-2 ${trendColor[tf.macd]}`}>{tf.macd}</td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-400">{tf.support.toFixed(d)}</td>
                  <td className="px-3 py-2 text-right font-mono text-red-400">{tf.resistance.toFixed(d)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${signalBadge[tf.signal]}`}>
                      {tf.signal === 'Buy' && <TrendingUp className="h-3 w-3" />}
                      {tf.signal === 'Sell' && <TrendingDown className="h-3 w-3" />}
                      {tf.signal === 'Hold' && <Minus className="h-3 w-3" />}
                      {tf.signal}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-300">{tf.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Multi-Timeframe Conclusion */}
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Brain className="h-3.5 w-3.5" /> Kesimpulan AI Multi-Kerangka Waktu
          </h3>
          <p className="text-sm leading-relaxed text-zinc-300">{conclusion}</p>
          <p className="mt-2 text-[10px] text-zinc-600 italic">Analisis dihasilkan otomatis — bukan nasihat keuangan.</p>
        </div>
      </section>
    </div>
  );
}
