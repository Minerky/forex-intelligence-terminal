'use client';

import { useState, useMemo } from 'react';
import { useForexStore } from '@/lib/store';
import { BASE_PRICES } from '@/lib/mock-data';
import type { BacktestResult, BacktestTrade } from '@/lib/types';
import {
  FlaskConical,
  Shield,
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

const STRATEGIES: Record<string, { entry: string; exit: string }> = {
  'EMA Crossover': {
    entry: 'Buy when EMA 20 crosses above EMA 50; Sell when EMA 20 crosses below EMA 50.',
    exit: 'Close when opposite crossover occurs or stop loss / take profit hit.',
  },
  'RSI Reversal': {
    entry: 'Buy when RSI crosses above 30 from oversold; Sell when RSI crosses below 70 from overbought.',
    exit: 'Close when RSI returns to neutral (50) or SL/TP hit.',
  },
  'MACD Momentum': {
    entry: 'Buy when MACD line crosses above signal line with positive histogram; Sell on bearish crossover.',
    exit: 'Close when histogram reverses sign or SL/TP hit.',
  },
  'Bollinger Bounce': {
    entry: 'Buy when price touches lower Bollinger Band and RSI < 35; Sell when price touches upper band and RSI > 65.',
    exit: 'Close at middle band (SMA 20) or SL/TP hit.',
  },
  'Breakout': {
    entry: 'Buy when price breaks above 20-period high with volume confirmation; Sell on break below 20-period low.',
    exit: 'Close after 2× ATR move or trailing stop of 1× ATR.',
  },
};

const STRATEGY_NAMES = Object.keys(STRATEGIES);

// ---------------------------------------------------------------------------
// Backtest engine (simulated)
// ---------------------------------------------------------------------------

function runBacktest(config: {
  pair: string;
  strategy: string;
  stopLoss: number;
  takeProfit: number;
  riskPercent: number;
}): BacktestResult {
  const basePrice = BASE_PRICES[config.pair] ?? 1.085;
  const isJpy = config.pair.includes('JPY');
  const pipSize = isJpy ? 0.01 : 0.0001;
  const decimals = isJpy ? 2 : 4;
  const round = (v: number) => Math.round(v * 10 ** decimals) / 10 ** decimals;

  // Win rates vary by strategy
  const winRates: Record<string, number> = {
    'EMA Crossover': 0.55,
    'RSI Reversal': 0.50,
    'MACD Momentum': 0.53,
    'Bollinger Bounce': 0.58,
    'Breakout': 0.48,
  };
  const baseWinRate = winRates[config.strategy] ?? 0.52;

  // Avg win/loss ratios
  const avgWinMultipliers: Record<string, number> = {
    'EMA Crossover': 1.3,
    'RSI Reversal': 1.6,
    'MACD Momentum': 1.4,
    'Bollinger Bounce': 1.2,
    'Breakout': 1.8,
  };
  const winMultiplier = avgWinMultipliers[config.strategy] ?? 1.3;

  const tradeCount = 60 + Math.floor(Math.random() * 40); // 60-99
  const trades: BacktestTrade[] = [];
  let startDate = new Date('2025-01-06');

  for (let i = 0; i < tradeCount; i++) {
    const isWin = Math.random() < baseWinRate + (Math.random() - 0.5) * 0.1;
    const direction: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';

    // Realistic entry around base price
    const entryOffset = (Math.random() - 0.5) * basePrice * 0.02;
    const entryPrice = round(basePrice + entryOffset);

    let pnlPips: number;
    if (isWin) {
      pnlPips = config.takeProfit * (0.6 + Math.random() * 0.6); // 60-120% of TP
    } else {
      pnlPips = -(config.stopLoss * (0.7 + Math.random() * 0.5)); // 70-120% of SL
    }

    const pnlPrice = pnlPips * pipSize;
    const exitPrice = round(
      direction === 'BUY' ? entryPrice + pnlPrice : entryPrice - pnlPrice
    );
    const pnl = Math.round(pnlPips * 10) / 10; // simplified $ per pip
    const pnlPercent = Math.round((pnl / 1000) * config.riskPercent * 100) / 100;

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

  // Max drawdown
  let peak = 0;
  let maxDD = 0;
  let cumulative = 0;
  for (const t of trades) {
    cumulative += t.pnl;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
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

export default function BacktestPage() {
  const pairs = useForexStore((s) => s.pairs);

  const [pair, setPair] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState<string>('1H');
  const [strategy, setStrategy] = useState(STRATEGY_NAMES[0]);
  const [stopLoss, setStopLoss] = useState(20);
  const [takeProfit, setTakeProfit] = useState(40);
  const [riskPercent, setRiskPercent] = useState(2);
  const [startDate, setStartDate] = useState('2025-01-06');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);

  const rules = STRATEGIES[strategy];

  function handleRun() {
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      setResult(runBacktest({ pair, strategy, stopLoss, takeProfit, riskPercent }));
      setRunning(false);
    }, 800);
  }

  // Equity curve data
  const equityData = useMemo(() => {
    if (!result) return [];
    let cum = 0;
    return result.trades.map((t, i) => {
      cum += t.pnl;
      return { trade: i + 1, equity: Math.round(cum * 100) / 100 };
    });
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Mesin Uji Balik (Backtesting)</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
          <FlaskConical className="h-5 w-5 text-emerald-400" />
          Mesin Uji Balik Strategi (Backtest)
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Uji performa strategi trading terhadap data historis simulasi
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* ----------------------------------------------------------------- */}
        {/* Configuration Panel                                               */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Konfigurasi Strategi
          </h2>

          {/* Pair */}
          <label className="block">
            <span className="text-xs text-zinc-500">Pasangan</span>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          {/* Timeframe */}
          <label className="block">
            <span className="text-xs text-zinc-500">Kerangka Waktu (Timeframe)</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </label>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-zinc-500">Tanggal Mulai</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">Tanggal Selesai</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>

          {/* Strategy */}
          <label className="block">
            <span className="text-xs text-zinc-500">Strategi</span>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              {STRATEGY_NAMES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          {/* Entry / Exit rules */}
          <div className="rounded border border-zinc-700 bg-zinc-800/50 p-3 text-xs text-zinc-400 space-y-2">
            <div>
              <span className="font-semibold text-emerald-400">Entry:</span>{' '}
              {rules.entry}
            </div>
            <div>
              <span className="font-semibold text-red-400">Exit:</span>{' '}
              {rules.exit}
            </div>
          </div>

          {/* SL / TP / Risk */}
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-zinc-500">Stop Loss (pips)</span>
              <input
                type="number"
                min={1}
                max={200}
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">Take Profit (pips)</span>
              <input
                type="number"
                min={1}
                max={500}
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">Risk %</span>
              <input
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={running}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {running ? (
              <span className="animate-pulse">Running backtest…</span>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Backtest
              </>
            )}
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Results Panel                                                     */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-5">
          {!result && !running && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-600 text-sm">
              Configure parameters and click Run Backtest
            </div>
          )}

          {running && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
              <div className="text-center">
                <BarChart3 className="mx-auto h-8 w-8 animate-pulse text-emerald-400" />
                <p className="mt-2 text-sm text-zinc-400">Processing {pair} on {timeframe}…</p>
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Trades" value={String(result.totalTrades)} />
                <StatCard
                  label="Win Rate"
                  value={`${result.winRate}%`}
                  positive={result.winRate >= 50}
                />
                <StatCard
                  label="Profit Factor"
                  value={result.profitFactor === Infinity ? '∞' : String(result.profitFactor)}
                  positive={result.profitFactor > 1}
                />
                <StatCard
                  label="Net Profit"
                  value={`${result.netProfit > 0 ? '+' : ''}${result.netProfit}`}
                  positive={result.netProfit > 0}
                />
                <StatCard
                  label="Max Drawdown"
                  value={`-${result.maxDrawdown}`}
                  positive={false}
                />
                <StatCard
                  label="Avg Win"
                  value={`+${result.avgWin}`}
                  positive={true}
                />
                <StatCard
                  label="Avg Loss"
                  value={`-${result.avgLoss}`}
                  positive={false}
                />
                <StatCard
                  label="Expectancy"
                  value={String(result.expectancy)}
                  positive={result.expectancy > 0}
                />
                <StatCard
                  label="Sharpe Ratio"
                  value={String(result.sharpeRatio)}
                  positive={result.sharpeRatio > 0}
                />
                <StatCard
                  label="Recovery Factor"
                  value={String(result.recoveryFactor)}
                  positive={result.recoveryFactor > 1}
                />
              </div>

              {/* Equity curve */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-400">Equity Curve</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={equityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="trade"
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      axisLine={{ stroke: '#3f3f46' }}
                    />
                    <YAxis
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      axisLine={{ stroke: '#3f3f46' }}
                    />
                    <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelFormatter={(v) => `Trade #${v}`}
                      formatter={(v) => [`${Number(v) > 0 ? '+' : ''}${v}`, 'P&L']}
                    />
                    <Line
                      type="monotone"
                      dataKey="equity"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Trade list */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-400">
                  Trade History ({result.totalTrades} trades)
                </h3>
                <div className="max-h-[400px] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-zinc-900">
                      <tr className="border-b border-zinc-800 text-left text-zinc-500">
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2">Entry Date</th>
                        <th className="px-2 py-2">Exit Date</th>
                        <th className="px-2 py-2">Dir</th>
                        <th className="px-2 py-2 text-right">Entry</th>
                        <th className="px-2 py-2 text-right">Exit</th>
                        <th className="px-2 py-2 text-right">P&L</th>
                        <th className="px-2 py-2 text-right">P&L%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((t) => (
                        <tr
                          key={t.id}
                          className={`border-b border-zinc-800/50 ${
                            t.pnl > 0
                              ? 'bg-emerald-500/[0.03]'
                              : 'bg-red-500/[0.03]'
                          }`}
                        >
                          <td className="px-2 py-1.5 font-mono text-zinc-500">{t.id}</td>
                          <td className="px-2 py-1.5 font-mono text-zinc-300">{t.entryDate}</td>
                          <td className="px-2 py-1.5 font-mono text-zinc-300">{t.exitDate}</td>
                          <td className="px-2 py-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                t.direction === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}
                            >
                              {t.direction === 'BUY' ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {t.direction}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-zinc-300">
                            {t.entryPrice.toFixed(pair.includes('JPY') ? 2 : 4)}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-zinc-300">
                            {t.exitPrice.toFixed(pair.includes('JPY') ? 2 : 4)}
                          </td>
                          <td
                            className={`px-2 py-1.5 text-right font-mono font-semibold ${
                              t.pnl > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {t.pnl > 0 ? '+' : ''}{t.pnl}
                          </td>
                          <td
                            className={`px-2 py-1.5 text-right font-mono ${
                              t.pnlPercent > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {t.pnlPercent > 0 ? '+' : ''}{t.pnlPercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-[11px] text-zinc-600">
                Backtest results use simulated data and do not guarantee future performance.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
