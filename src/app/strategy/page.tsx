'use client';

import { useState, useMemo } from 'react';
import { useForexStore } from '@/lib/store';
import { BASE_PRICES } from '@/lib/mock-data';
import type { BacktestResult, BacktestTrade } from '@/lib/types';
import {
  Waypoints,
  Shield,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Play,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAIRS = Object.keys(BASE_PRICES);
const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', 'Daily'] as const;

// ---------------------------------------------------------------------------
// AI strategy templates (picked based on keywords + pair + timeframe)
// ---------------------------------------------------------------------------

interface GeneratedStrategy {
  name: string;
  entryConditions: string[];
  exitConditions: string[];
  stopLoss: string;
  takeProfit: string;
  riskManagement: string;
  filters: string[];
}

function generateStrategy(prompt: string, pair: string, timeframe: string): GeneratedStrategy {
  const lower = prompt.toLowerCase();
  const hasEma = lower.includes('ema') || lower.includes('moving average');
  const hasRsi = lower.includes('rsi');
  const hasMacd = lower.includes('macd');
  const hasBb = lower.includes('bollinger') || lower.includes('band');
  const isScalp = timeframe === '1m' || timeframe === '5m';
  const isSwing = timeframe === '4H' || timeframe === 'Daily';

  if (hasEma && hasRsi) {
    return {
      name: `${pair} EMA-RSI ${timeframe} Strategy`,
      entryConditions: [
        'EMA 20 crosses above EMA 50 (bullish crossover)',
        'RSI(14) is between 50 and 70 (confirms momentum without overbought)',
        'Price is above EMA 200 (long-term trend filter)',
      ],
      exitConditions: [
        'EMA 20 crosses below EMA 50 (bearish crossover)',
        'RSI drops below 40 (momentum loss)',
        'Stop loss or take profit hit',
      ],
      stopLoss: `${isScalp ? '10' : isSwing ? '40' : '20'} pips below entry (below recent swing low)`,
      takeProfit: `${isScalp ? '20' : isSwing ? '80' : '40'} pips above entry (2:1 R:R target)`,
      riskManagement: 'Risk 1-2% of account per trade. Max 3 concurrent positions.',
      filters: [
        'Avoid trading 30 minutes before/after high-impact news',
        'Only trade during London and New York sessions',
        `Volume must be above ${timeframe} average`,
      ],
    };
  }

  if (hasMacd) {
    return {
      name: `${pair} MACD Momentum ${timeframe}`,
      entryConditions: [
        'MACD line crosses above signal line',
        'MACD histogram turns positive and increasing',
        'Price is above VWAP or EMA 50',
      ],
      exitConditions: [
        'MACD histogram starts decreasing for 2 consecutive bars',
        'MACD bearish crossover (line crosses below signal)',
        'Take profit level reached',
      ],
      stopLoss: `${isScalp ? '12' : '25'} pips below entry`,
      takeProfit: `${isScalp ? '24' : '50'} pips (2:1 R:R)`,
      riskManagement: 'Risk 1.5% per trade. Scale out 50% at 1:1 R:R.',
      filters: [
        'ADX must be above 20 (trending market only)',
        'Avoid ranging markets (check Bollinger Band width)',
      ],
    };
  }

  if (hasBb) {
    return {
      name: `${pair} Bollinger Bounce ${timeframe}`,
      entryConditions: [
        'Price touches or closes below lower Bollinger Band (20, 2)',
        'RSI(14) is below 35 (oversold confirmation)',
        'Bullish candlestick pattern at the band (hammer, engulfing)',
      ],
      exitConditions: [
        'Price reaches middle Bollinger Band (SMA 20)',
        'Price touches upper Bollinger Band (extended target)',
        'RSI exceeds 65',
      ],
      stopLoss: '15 pips below the lower Bollinger Band',
      takeProfit: 'Middle band for conservative; upper band for aggressive',
      riskManagement: 'Risk 1% per trade. Best in ranging markets.',
      filters: [
        'Bollinger Band width must be contracting (squeeze setup)',
        'Avoid during strong trending conditions (ADX > 30)',
      ],
    };
  }

  // Default: trend-following
  return {
    name: `${pair} AI Trend Strategy ${timeframe}`,
    entryConditions: [
      'EMA 9 crosses above EMA 21 (short-term momentum shift)',
      'Price closes above EMA 50 (trend confirmation)',
      'RSI(14) between 45 and 70 (bullish zone, not overbought)',
      'MACD histogram positive (momentum confirmation)',
    ],
    exitConditions: [
      'EMA 9 crosses below EMA 21',
      'RSI drops below 40 or rises above 80',
      'Price closes below EMA 50',
    ],
    stopLoss: `${isScalp ? '8' : isSwing ? '50' : '25'} pips below entry`,
    takeProfit: `${isScalp ? '16' : isSwing ? '100' : '50'} pips target (2:1 R:R)`,
    riskManagement: 'Risk 2% per trade. Trailing stop after 1:1 R:R achieved.',
    filters: [
      'Trade only with the daily trend direction',
      'Avoid first and last 15 minutes of session',
      'No new entries on Fridays after 12:00 GMT',
    ],
  };
}

// ---------------------------------------------------------------------------
// Backtest engine (reused logic)
// ---------------------------------------------------------------------------

function runBacktest(pair: string, strategy: string): BacktestResult {
  const basePrice = BASE_PRICES[pair] ?? 1.085;
  const isJpy = pair.includes('JPY');
  const pipSize = isJpy ? 0.01 : 0.0001;
  const decimals = isJpy ? 2 : 4;
  const round = (v: number) => Math.round(v * 10 ** decimals) / 10 ** decimals;

  const winRate = 0.50 + Math.random() * 0.1; // 50-60%
  const tradeCount = 50 + Math.floor(Math.random() * 30);
  const trades: BacktestTrade[] = [];
  let startDate = new Date('2025-01-06');

  for (let i = 0; i < tradeCount; i++) {
    const isWin = Math.random() < winRate;
    const direction: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const entryOffset = (Math.random() - 0.5) * basePrice * 0.02;
    const entryPrice = round(basePrice + entryOffset);
    const pnlPips = isWin
      ? 15 + Math.random() * 35
      : -(10 + Math.random() * 20);
    const pnlPrice = pnlPips * pipSize;
    const exitPrice = round(direction === 'BUY' ? entryPrice + pnlPrice : entryPrice - pnlPrice);
    const pnl = Math.round(pnlPips * 10) / 10;
    const pnlPercent = Math.round((pnl / 1000) * 2 * 100) / 100;

    const entryDate = new Date(startDate);
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 3) + 1);
    const exitDate = new Date(startDate);
    exitDate.setHours(exitDate.getHours() + Math.floor(Math.random() * 48) + 1);

    trades.push({
      id: i + 1,
      entryDate: entryDate.toISOString().slice(0, 10),
      exitDate: exitDate.toISOString().slice(0, 10),
      direction,
      entryPrice,
      exitPrice,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent,
    });
  }

  const winningTrades = trades.filter((t) => t.pnl > 0);
  const losingTrades = trades.filter((t) => t.pnl <= 0);
  const totalWins = winningTrades.reduce((s, t) => s + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((s, t) => s + t.pnl, 0));
  const netProfit = Math.round((totalWins - totalLosses) * 100) / 100;
  const avgWin = winningTrades.length ? Math.round((totalWins / winningTrades.length) * 100) / 100 : 0;
  const avgLoss = losingTrades.length ? Math.round((totalLosses / losingTrades.length) * 100) / 100 : 0;

  let peak = 0, maxDD = 0, cum = 0;
  for (const t of trades) {
    cum += t.pnl;
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDD) maxDD = dd;
  }

  const expectancy = trades.length
    ? Math.round(((avgWin * winningTrades.length - avgLoss * losingTrades.length) / trades.length) * 100) / 100
    : 0;

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Math.round((winningTrades.length / trades.length) * 10000) / 100,
    profitFactor: totalLosses > 0 ? Math.round((totalWins / totalLosses) * 100) / 100 : Infinity,
    netProfit,
    maxDrawdown: Math.round(maxDD * 100) / 100,
    avgWin,
    avgLoss,
    expectancy,
    sharpeRatio: Math.round((netProfit / (maxDD || 1)) * 1.2 * 100) / 100,
    recoveryFactor: maxDD > 0 ? Math.round((netProfit / maxDD) * 100) / 100 : 0,
    trades,
  };
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value, positive }: { label: string; value: string; positive?: boolean | null }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div
        className={`mt-1 font-mono text-lg font-semibold ${
          positive === true ? 'text-emerald-400' : positive === false ? 'text-red-400' : 'text-zinc-100'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StrategyPage() {
  const [pair, setPair] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState<string>('1H');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState<GeneratedStrategy | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setStrategy(null);
    setBacktestResult(null);
    setTimeout(() => {
      const strat = generateStrategy(prompt, pair, timeframe);
      setStrategy(strat);
      // Auto-backtest
      setTimeout(() => {
        setBacktestResult(runBacktest(pair, strat.name));
        setGenerating(false);
      }, 600);
    }, 1500);
  }

  const equityData = useMemo(() => {
    if (!backtestResult) return [];
    let cum = 0;
    return backtestResult.trades.map((t, i) => {
      cum += t.pnl;
      return { trade: i + 1, equity: Math.round(cum * 100) / 100 };
    });
  }, [backtestResult]);

  return (
    <div className="space-y-6">
      {/* Pro Live badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          <Shield className="h-3 w-3" />
          PRO TRADING TERMINAL
        </span>
        <span className="text-xs text-zinc-500 font-mono">Pembangun Strategi AI</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
          <Waypoints className="h-5 w-5 text-emerald-400" />
          Pembangun Strategi AI (Strategy Builder)
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Jelaskan ide trading Anda dan dapatkan strategi lengkap beserta hasil uji balik (backtest) otomatis
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Strategy Input                                                    */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Deskripsikan Strategi Anda
        </h2>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Find a EUR/USD strategy using EMA and RSI for 1H timeframe"
          className="block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none resize-none"
        />

        <div className="flex flex-wrap gap-3">
          <label className="block">
            <span className="text-xs text-zinc-500">Pair</span>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="mt-1 block rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-zinc-500">Timeframe</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="mt-1 block rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {generating ? (
                <span className="animate-pulse">Generating…</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Strategy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Generated Strategy                                                */}
      {/* ----------------------------------------------------------------- */}
      {strategy && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-400">
            <Sparkles className="h-4 w-4" />
            {strategy.name}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Entry conditions */}
            <div className="rounded border border-zinc-700 bg-zinc-800/50 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase text-emerald-400">Entry Conditions</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-300">
                {strategy.entryConditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>
            </div>

            {/* Exit conditions */}
            <div className="rounded border border-zinc-700 bg-zinc-800/50 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase text-red-400">Exit Conditions</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-300">
                {strategy.exitConditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>
            </div>

            {/* SL / TP */}
            <div className="rounded border border-zinc-700 bg-zinc-800/50 p-4 space-y-2">
              <div>
                <span className="text-xs font-bold uppercase text-amber-400">Stop Loss: </span>
                <span className="text-sm text-zinc-300">{strategy.stopLoss}</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-emerald-400">Take Profit: </span>
                <span className="text-sm text-zinc-300">{strategy.takeProfit}</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-blue-400">Risk: </span>
                <span className="text-sm text-zinc-300">{strategy.riskManagement}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="rounded border border-zinc-700 bg-zinc-800/50 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase text-zinc-400">Filters / Conditions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                {strategy.filters.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Auto-Backtest Results                                             */}
      {/* ----------------------------------------------------------------- */}
      {generating && !backtestResult && strategy && (
        <div className="flex h-40 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="text-center">
            <BarChart3 className="mx-auto h-8 w-8 animate-pulse text-emerald-400" />
            <p className="mt-2 text-sm text-zinc-400">Running auto-backtest…</p>
          </div>
        </div>
      )}

      {backtestResult && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <BarChart3 className="h-4 w-4" />
            Auto-Backtest Results
          </h2>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total Trades" value={String(backtestResult.totalTrades)} />
            <StatCard label="Win Rate" value={`${backtestResult.winRate}%`} positive={backtestResult.winRate >= 50} />
            <StatCard
              label="Profit Factor"
              value={backtestResult.profitFactor === Infinity ? '∞' : String(backtestResult.profitFactor)}
              positive={backtestResult.profitFactor > 1}
            />
            <StatCard
              label="Net Profit"
              value={`${backtestResult.netProfit > 0 ? '+' : ''}${backtestResult.netProfit}`}
              positive={backtestResult.netProfit > 0}
            />
            <StatCard label="Max Drawdown" value={`-${backtestResult.maxDrawdown}`} positive={false} />
            <StatCard label="Avg Win" value={`+${backtestResult.avgWin}`} positive={true} />
            <StatCard label="Avg Loss" value={`-${backtestResult.avgLoss}`} positive={false} />
            <StatCard label="Expectancy" value={String(backtestResult.expectancy)} positive={backtestResult.expectancy > 0} />
            <StatCard label="Sharpe Ratio" value={String(backtestResult.sharpeRatio)} positive={backtestResult.sharpeRatio > 0} />
            <StatCard label="Recovery Factor" value={String(backtestResult.recoveryFactor)} positive={backtestResult.recoveryFactor > 1} />
          </div>

          {/* Equity curve */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-400">Equity Curve</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="trade" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} />
                <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => `Trade #${v}`}
                  formatter={(v) => [`${Number(v) > 0 ? '+' : ''}${v}`, 'P&L']}
                />
                <Line type="monotone" dataKey="equity" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-zinc-600">
            AI-generated strategies require thorough testing. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
