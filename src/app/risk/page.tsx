'use client';

import { useState, useMemo } from 'react';
import { useForexStore } from '@/lib/store';
import { BASE_PRICES } from '@/lib/mock-data';
import type { RiskCalculation } from '@/lib/types';
import {
  ShieldCheck,
  Shield,
  AlertTriangle,
  Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAIRS = Object.keys(BASE_PRICES);
const ACCOUNT_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'] as const;

// ---------------------------------------------------------------------------
// Risk calculation
// ---------------------------------------------------------------------------

function calculateRisk(config: {
  balance: number;
  riskPercent: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  pair: string;
}): RiskCalculation & { pipValue: number; lotSizeStandard: number; lotSizeMini: number; lotSizeMicro: number; riskPips: number; rewardPips: number } {
  const { balance, riskPercent, entryPrice, stopLoss, takeProfit, pair } = config;
  const isJpy = pair.includes('JPY');
  const isGold = pair.includes('XAU');
  const pipSize = isGold ? 0.1 : isJpy ? 0.01 : 0.0001;

  const riskAmount = (balance * riskPercent) / 100;
  const riskPips = Math.abs(entryPrice - stopLoss) / pipSize;
  const rewardPips = Math.abs(takeProfit - entryPrice) / pipSize;

  // Pip value per standard lot
  let pipValuePerLot = 10; // default $10 per pip for 1.00 lot
  if (isGold) {
    pipValuePerLot = 10; // Gold 1.00 lot = 100 oz, $0.10 move = $10.00
  } else if (pair.endsWith('/USD')) {
    pipValuePerLot = 100000 * pipSize;
  } else if (pair.startsWith('USD/')) {
    pipValuePerLot = (100000 * pipSize) / entryPrice;
  } else {
    pipValuePerLot = 100000 * pipSize;
  }

  const pipValuePerUnit = pipValuePerLot / 100000;
  const positionSize = riskPips > 0 ? riskAmount / (riskPips * pipValuePerUnit) : 0;
  const lotSize = positionSize / 100000;
  const potentialProfit = rewardPips * pipValuePerUnit * positionSize;
  const riskReward = riskPips > 0 ? rewardPips / riskPips : 0;
  const marginEstimate = (positionSize * entryPrice) / 30; // ~30:1 leverage

  return {
    positionSize: Math.round(positionSize),
    lotSize: Math.round(lotSize * 100) / 100,
    lotSizeStandard: Math.round(lotSize * 100) / 100,
    lotSizeMini: Math.round(lotSize * 10 * 100) / 100,
    lotSizeMicro: Math.round(lotSize * 100 * 100) / 100,
    riskAmount: Math.round(riskAmount * 100) / 100,
    potentialProfit: Math.round(potentialProfit * 100) / 100,
    riskReward: Math.round(riskReward * 100) / 100,
    marginEstimate: Math.round(marginEstimate * 100) / 100,
    pipValue: Math.round(pipValuePerLot * 100) / 100,
    riskPips: Math.round(riskPips * 10) / 10,
    rewardPips: Math.round(rewardPips * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RiskPage() {
  const [pair, setPair] = useState('EUR/USD');
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [balance, setBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(2);
  const [entryPrice, setEntryPrice] = useState(BASE_PRICES['EUR/USD']);
  const [stopLoss, setStopLoss] = useState(BASE_PRICES['EUR/USD'] - 0.0020);
  const [takeProfit, setTakeProfit] = useState(BASE_PRICES['EUR/USD'] + 0.0040);

  // Update prices when pair changes
  function handlePairChange(newPair: string) {
    setPair(newPair);
    const bp = BASE_PRICES[newPair] ?? 1.085;
    const isJpy = newPair.includes('JPY');
    const offset = isJpy ? 0.20 : 0.0020;
    setEntryPrice(bp);
    setStopLoss(Math.round((bp - offset) * (isJpy ? 100 : 10000)) / (isJpy ? 100 : 10000));
    setTakeProfit(Math.round((bp + offset * 2) * (isJpy ? 100 : 10000)) / (isJpy ? 100 : 10000));
  }

  const result = useMemo(
    () => calculateRisk({ balance, riskPercent, entryPrice, stopLoss, takeProfit, pair }),
    [balance, riskPercent, entryPrice, stopLoss, takeProfit, pair]
  );

  const riskBarWidth = balance > 0 ? Math.min((result.riskAmount / balance) * 100, 100) : 0;
  const rrTotal = result.riskAmount + result.potentialProfit;
  const riskShare = rrTotal > 0 ? (result.riskAmount / rrTotal) * 100 : 50;
  const isJpy = pair.includes('JPY');
  const priceStep = isJpy ? 0.01 : 0.0001;

  return (
    <div className="space-y-6">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Manajemen Risiko</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Kalkulator Manajemen Risiko & Ukuran Lot
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Hitung ukuran posisi, ukuran lot, dan rasio risiko/imbalan sebelum mengeksekusi perdagangan
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* ----------------------------------------------------------------- */}
        {/* Input Form                                                        */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Parameter Perdagangan
          </h2>

          {/* Balance */}
          <label className="block">
            <span className="text-xs text-zinc-500">Saldo Akun ($)</span>
            <input
              type="number"
              min={100}
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </label>

          {/* Risk % with slider */}
          <label className="block">
            <span className="text-xs text-zinc-500">
              Persentase Risiko:{' '}
              <span className="font-mono font-semibold text-zinc-100">{riskPercent}%</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.5}
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="mt-1 block w-full accent-emerald-500"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-zinc-600">
              <span>0.5%</span>
              <span>5%</span>
              <span>10%</span>
            </div>
          </label>

          {/* Pair */}
          <label className="block">
            <span className="text-xs text-zinc-500">Pasangan</span>
            <select
              value={pair}
              onChange={(e) => handlePairChange(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          {/* Account Currency */}
          <label className="block">
            <span className="text-xs text-zinc-500">Mata Uang Akun</span>
            <select
              value={accountCurrency}
              onChange={(e) => setAccountCurrency(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            >
              {ACCOUNT_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {/* Entry / SL / TP */}
          <label className="block">
            <span className="text-xs text-zinc-500">Harga Masuk (Entry)</span>
            <input
              type="number"
              step={priceStep}
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs text-zinc-500">Harga Stop Loss / Cut Loss</span>
            <input
              type="number"
              step={priceStep}
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs text-zinc-500">Harga Take Profit</span>
            <input
              type="number"
              step={priceStep}
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value))}
              className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Results                                                           */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-5">
          {/* Calculated values */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ResultCard label="Position Size" value={`${result.positionSize.toLocaleString()} units`} />
            <ResultCard label="Standard Lots" value={String(result.lotSizeStandard)} />
            <ResultCard label="Mini Lots" value={String(result.lotSizeMini)} />
            <ResultCard label="Micro Lots" value={String(result.lotSizeMicro)} />
            <ResultCard label="Risk Amount" value={`$${result.riskAmount.toLocaleString()}`} color="text-red-400" />
            <ResultCard label="Potential Profit" value={`$${result.potentialProfit.toLocaleString()}`} color="text-emerald-400" />
            <ResultCard
              label="Risk / Reward"
              value={`1 : ${result.riskReward}`}
              color={result.riskReward >= 2 ? 'text-emerald-400' : result.riskReward >= 1 ? 'text-amber-400' : 'text-red-400'}
            />
            <ResultCard label="Margin Estimate" value={`$${result.marginEstimate.toLocaleString()}`} />
            <ResultCard label="Pip Value (per lot)" value={`$${result.pipValue}`} />
            <ResultCard label="Risk (pips)" value={String(result.riskPips)} color="text-red-400" />
            <ResultCard label="Reward (pips)" value={String(result.rewardPips)} color="text-emerald-400" />
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* Risk Visualization                                               */}
          {/* ----------------------------------------------------------------- */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Risk Visualization</h3>

            {/* Risk vs Account */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>Risk vs Account Balance</span>
                <span className="font-mono">{riskBarWidth.toFixed(1)}%</span>
              </div>
              <div className="h-5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    riskPercent > 5 ? 'bg-red-500' : riskPercent > 2 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${riskBarWidth}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
                <span>$0</span>
                <span className="font-mono">${balance.toLocaleString()}</span>
              </div>
            </div>

            {/* R:R Visual */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>Risk : Reward Ratio</span>
                <span className="font-mono">1 : {result.riskReward}</span>
              </div>
              <div className="flex h-8 w-full overflow-hidden rounded-lg">
                <div
                  className="flex items-center justify-center bg-red-500/80 text-[10px] font-bold text-white transition-all"
                  style={{ width: `${riskShare}%` }}
                >
                  Risk ${result.riskAmount}
                </div>
                <div
                  className="flex items-center justify-center bg-emerald-500/80 text-[10px] font-bold text-white transition-all"
                  style={{ width: `${100 - riskShare}%` }}
                >
                  Reward ${result.potentialProfit}
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* Risk Rules                                                       */}
          {/* ----------------------------------------------------------------- */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              <Info className="h-4 w-4" />
              Risk Management Rules
            </h3>
            <div className="space-y-3">
              <RuleItem
                ok={riskPercent <= 2}
                text="Never risk more than 2% per trade"
                detail={riskPercent <= 2 ? 'Your risk is within safe limits' : `Current risk ${riskPercent}% exceeds recommended 2%`}
              />
              <RuleItem
                ok={result.riskReward >= 2}
                text="Minimum R:R of 1:2 recommended"
                detail={result.riskReward >= 2 ? `Current R:R is 1:${result.riskReward}` : `Current R:R is 1:${result.riskReward} — consider widening TP or tightening SL`}
              />
              <RuleItem
                ok={result.marginEstimate / balance < 0.05}
                text="Maximum position size should not exceed 5% of account"
                detail={`Margin uses ${((result.marginEstimate / balance) * 100).toFixed(1)}% of account`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ResultCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${color ?? 'text-zinc-100'}`}>{value}</div>
    </div>
  );
}

function RuleItem({ ok, text, detail }: { ok: boolean; text: string; detail: string }) {
  return (
    <div className={`flex items-start gap-3 rounded border p-3 ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <div className={`mt-0.5 rounded-full p-1 ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
        {ok ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      </div>
      <div>
        <div className={`text-sm font-medium ${ok ? 'text-emerald-300' : 'text-red-300'}`}>{text}</div>
        <div className="mt-0.5 text-xs text-zinc-500">{detail}</div>
      </div>
    </div>
  );
}
