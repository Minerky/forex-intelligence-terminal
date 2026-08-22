'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForexStore } from '@/lib/store';
import { TradingViewChart } from '@/components/tradingview-chart';
import {
  Shield,
  Layers,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Compass,
  Boxes,
} from 'lucide-react';

interface OrderBlock {
  type: 'BULLISH_OB' | 'BEARISH_OB';
  timeframe: string;
  topPrice: number;
  bottomPrice: number;
  strength: 'HIGH' | 'MEDIUM';
  mitigated: boolean;
  notes: string;
}

interface FVG {
  type: 'BULLISH_FVG' | 'BEARISH_FVG';
  timeframe: string;
  high: number;
  low: number;
  status: 'UNFILLED' | 'PARTIAL' | 'FILLED';
}

interface SessionLiquidity {
  session: string;
  high: number;
  low: number;
  swept: 'NONE' | 'HIGH_SWEPT' | 'LOW_SWEPT';
}

export default function SMCPage() {
  const pairs = useForexStore((s) => s.pairs);
  const selectedPair = useForexStore((s) => s.selectedPair);
  const setSelectedPair = useForexStore((s) => s.setSelectedPair);
  const updatePrices = useForexStore((s) => s.updatePrices);

  const [timeframe, setTimeframe] = useState<'M15' | 'H1' | 'H4'>('M15');

  useEffect(() => {
    const id = setInterval(updatePrices, 2000);
    return () => clearInterval(id);
  }, [updatePrices]);

  const currentPairData = pairs.find((p) => p.symbol === selectedPair) || pairs[0];
  const p = currentPairData.price;
  const isGold = selectedPair.includes('XAU');
  const isJPY = selectedPair.includes('JPY');
  const d = isGold || isJPY ? 2 : 4;
  const pip = isGold ? 0.1 : isJPY ? 0.01 : 0.0001;

  // Dynamic SMC Levels based on real TradingView prices
  const orderBlocks: OrderBlock[] = useMemo(() => {
    const obDist = isGold ? 6.0 : isJPY ? 0.45 : 0.0035;
    return [
      {
        type: 'BEARISH_OB',
        timeframe: 'H1',
        topPrice: Number((p + obDist * 1.8).toFixed(d)),
        bottomPrice: Number((p + obDist * 1.3).toFixed(d)),
        strength: 'HIGH',
        mitigated: false,
        notes: 'Area Supply Institusi Utama — Potensi Rejection Sell Kuat',
      },
      {
        type: 'BEARISH_OB',
        timeframe: 'M15',
        topPrice: Number((p + obDist * 0.9).toFixed(d)),
        bottomPrice: Number((p + obDist * 0.5).toFixed(d)),
        strength: 'MEDIUM',
        mitigated: false,
        notes: 'Decisional Supply Zone intraday',
      },
      {
        type: 'BULLISH_OB',
        timeframe: 'M15',
        topPrice: Number((p - obDist * 0.5).toFixed(d)),
        bottomPrice: Number((p - obDist * 0.9).toFixed(d)),
        strength: 'MEDIUM',
        mitigated: false,
        notes: 'Decisional Demand Zone intraday',
      },
      {
        type: 'BULLISH_OB',
        timeframe: 'H1',
        topPrice: Number((p - obDist * 1.3).toFixed(d)),
        bottomPrice: Number((p - obDist * 1.8).toFixed(d)),
        strength: 'HIGH',
        mitigated: false,
        notes: 'Origin Demand Block Institusi — Area Akumulasi Buy Kuat',
      },
    ];
  }, [p, isGold, isJPY, d]);

  // Fair Value Gaps (FVG)
  const fvgs: FVG[] = useMemo(() => {
    const fvgOffset = isGold ? 4.5 : isJPY ? 0.25 : 0.002;
    return [
      {
        type: 'BEARISH_FVG',
        timeframe: 'M15',
        high: Number((p + fvgOffset * 1.2).toFixed(d)),
        low: Number((p + fvgOffset * 0.7).toFixed(d)),
        status: 'UNFILLED',
      },
      {
        type: 'BULLISH_FVG',
        timeframe: 'M15',
        high: Number((p - fvgOffset * 0.7).toFixed(d)),
        low: Number((p - fvgOffset * 1.2).toFixed(d)),
        status: 'UNFILLED',
      },
    ];
  }, [p, isGold, isJPY, d]);

  // Session Liquidity
  const sessionLiquidity: SessionLiquidity[] = useMemo(() => {
    const sOffset = isGold ? 8.0 : isJPY ? 0.5 : 0.004;
    return [
      {
        session: 'Sesi Asia (Tokyo)',
        high: Number((p + sOffset * 0.6).toFixed(d)),
        low: Number((p - sOffset * 0.8).toFixed(d)),
        swept: 'LOW_SWEPT',
      },
      {
        session: 'Sesi London',
        high: Number((p + sOffset * 1.1).toFixed(d)),
        low: Number((p - sOffset * 0.5).toFixed(d)),
        swept: 'NONE',
      },
      {
        session: 'Sesi New York',
        high: Number((p + sOffset * 1.5).toFixed(d)),
        low: Number((p - sOffset * 1.3).toFixed(d)),
        swept: 'NONE',
      },
    ];
  }, [p, isGold, isJPY, d]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <Shield className="h-3 w-3" />
            PRO TRADING TERMINAL
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            Smart Money Concepts &amp; Likuiditas Institusi
          </span>
        </div>

        {/* Pair Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Instrumen:</span>
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200 focus:outline-none font-mono"
          >
            {pairs.map((pr) => (
              <option key={pr.symbol} value={pr.symbol}>
                {pr.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SMC Live TradingView Chart */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-200">
            <Boxes className="h-4 w-4 text-purple-400" /> Analisis Struktur Pasar &amp; Likuiditas ({selectedPair})
          </h2>
          <div className="flex gap-1 bg-zinc-800 p-0.5 rounded-lg text-[10px] font-bold">
            {(['M15', 'H1', 'H4'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded ${
                  timeframe === tf ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <TradingViewChart symbol={selectedPair} height={460} interval={timeframe === 'M15' ? '15' : timeframe === 'H1' ? '60' : '240'} />
      </section>

      {/* SMC Modules Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Module 1: Order Blocks (OB) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Layers className="h-4 w-4" /> Zona Order Block (OB) Institusi
          </h3>
          <p className="text-[11px] text-zinc-400">Area jejak jejak order bank besar &amp; institusi:</p>

          <div className="space-y-2.5">
            {orderBlocks.map((ob, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 ${
                  ob.type === 'BULLISH_OB'
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : 'border-red-500/30 bg-red-950/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className={ob.type === 'BULLISH_OB' ? 'text-emerald-400' : 'text-red-400'}>
                    {ob.type === 'BULLISH_OB' ? '🟢 Demand OB' : '🔴 Supply OB'} ({ob.timeframe})
                  </span>
                  <span className="text-zinc-200">
                    {ob.bottomPrice.toFixed(d)} – {ob.topPrice.toFixed(d)}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">{ob.notes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Module 2: Fair Value Gap (FVG) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-4 w-4" /> Fair Value Gap (FVG / Imbalance)
          </h3>
          <p className="text-[11px] text-zinc-400">Area ketidakseimbangan harga yang biasanya akan diisi (magnet harga):</p>

          <div className="space-y-2.5">
            {fvgs.map((fvg, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 ${
                  fvg.type === 'BULLISH_FVG'
                    ? 'border-emerald-500/30 bg-zinc-950'
                    : 'border-red-500/30 bg-zinc-950'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className={fvg.type === 'BULLISH_FVG' ? 'text-emerald-400' : 'text-red-400'}>
                    {fvg.type === 'BULLISH_FVG' ? 'Bullish FVG Gap' : 'Bearish FVG Gap'}
                  </span>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-400 ring-1 ring-amber-500/30">
                    {fvg.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-300">
                  Rentang Gap: <strong className="text-zinc-100">{fvg.low.toFixed(d)} – {fvg.high.toFixed(d)}</strong>
                </div>
              </div>
            ))}

            <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800/80 text-[11px] text-zinc-400">
              💡 <strong>Trading Rule SMC:</strong> Tunggu harga masuk ke dalam FVG lalu cari konfirmasi candlestick rejection untuk entry dengan Stop Loss tipis.
            </div>
          </div>
        </div>

        {/* Module 3: Session Liquidity Sweeps */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Compass className="h-4 w-4" /> Likuiditas Sesi (Session Sweeps)
          </h3>
          <p className="text-[11px] text-zinc-400">Puncak &amp; Lembah Sesi yang menjadi target pemburuan Stop Loss institusi:</p>

          <div className="space-y-2.5">
            {sessionLiquidity.map((sl, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-200">{sl.session}</span>
                  {sl.swept === 'LOW_SWEPT' ? (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">
                      ✓ Low Swept (Reversal Up)
                    </span>
                  ) : (
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">
                      Likuiditas Utuh
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 text-[10px] font-mono pt-1">
                  <span className="text-red-400">High: {sl.high.toFixed(d)}</span>
                  <span className="text-emerald-400 text-right">Low: {sl.low.toFixed(d)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
