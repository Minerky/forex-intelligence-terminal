'use client';

import { useState, useMemo } from 'react';
import { useForexStore } from '@/lib/store';
import type { Currency } from '@/lib/types';
import {
  Shield,
  Brain,
  Landmark,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRightLeft,
  BarChart3,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type Stance = 'Hawkish' | 'Neutral' | 'Dovish';

interface CurrencyFundamentals {
  currency: Currency;
  interestRate: number;
  rateTrend: string;
  cpi: number;
  cpiTarget: number;
  employment: string;
  employmentTrend: string;
  gdp: number;
  gdpTrend: string;
  tradeBalance: string;
  consumerConfidence: number;
  pmiManufacturing: number;
  pmiServices: number;
  centralBank: string;
  stance: Stance;
  lastMeeting: string;
  nextMeeting: string;
  marketExpectation: string;
  rateTrajectory: string;
}

const FUNDAMENTALS: Record<Currency, CurrencyFundamentals> = {
  USD: {
    currency: 'USD',
    interestRate: 5.50,
    rateTrend: 'Hawkish',
    cpi: 3.2,
    cpiTarget: 2.0,
    employment: '216K NFP',
    employmentTrend: 'Strong',
    gdp: 2.1,
    gdpTrend: 'Resilient',
    tradeBalance: '-$64.2B',
    consumerConfidence: 102.0,
    pmiManufacturing: 49.1,
    pmiServices: 52.7,
    centralBank: 'Federal Reserve (Fed)',
    stance: 'Hawkish',
    lastMeeting: 'Held at 5.25-5.50%',
    nextMeeting: '2026-09-17',
    marketExpectation: '85% probability of hold',
    rateTrajectory: 'Expected to hold through Q3, potential cut Q4',
  },
  EUR: {
    currency: 'EUR',
    interestRate: 4.50,
    rateTrend: 'Neutral',
    cpi: 2.9,
    cpiTarget: 2.0,
    employment: '6.4% unemployment',
    employmentTrend: 'Stable',
    gdp: 0.3,
    gdpTrend: 'Weak',
    tradeBalance: '+€28.1B',
    consumerConfidence: -15.1,
    pmiManufacturing: 44.8,
    pmiServices: 51.6,
    centralBank: 'European Central Bank (ECB)',
    stance: 'Neutral',
    lastMeeting: 'Held at 4.50%',
    nextMeeting: '2026-09-12',
    marketExpectation: '60% probability of 25bp cut',
    rateTrajectory: 'Expected to begin cutting cycle',
  },
  GBP: {
    currency: 'GBP',
    interestRate: 5.25,
    rateTrend: 'Hawkish',
    cpi: 4.0,
    cpiTarget: 2.0,
    employment: '4.2% unemployment',
    employmentTrend: 'Tight labor market',
    gdp: 0.1,
    gdpTrend: 'Stagnant',
    tradeBalance: '-£4.8B',
    consumerConfidence: -21.0,
    pmiManufacturing: 47.5,
    pmiServices: 53.4,
    centralBank: 'Bank of England (BoE)',
    stance: 'Hawkish',
    lastMeeting: 'Held at 5.25%',
    nextMeeting: '2026-09-19',
    marketExpectation: '70% probability of hold',
    rateTrajectory: 'Expected to hold, sticky inflation delays cuts',
  },
  JPY: {
    currency: 'JPY',
    interestRate: -0.10,
    rateTrend: 'Dovish shifting',
    cpi: 3.3,
    cpiTarget: 2.0,
    employment: '2.5% unemployment',
    employmentTrend: 'Tight',
    gdp: 1.2,
    gdpTrend: 'Recovering',
    tradeBalance: '-¥462B',
    consumerConfidence: 36.1,
    pmiManufacturing: 49.6,
    pmiServices: 53.8,
    centralBank: 'Bank of Japan (BoJ)',
    stance: 'Dovish',
    lastMeeting: 'Held at -0.10%, YCC adjustment',
    nextMeeting: '2026-09-22',
    marketExpectation: 'Watching for YCC exit signals',
    rateTrajectory: 'Expected to normalize gradually',
  },
  CHF: {
    currency: 'CHF',
    interestRate: 1.75,
    rateTrend: 'Neutral',
    cpi: 1.7,
    cpiTarget: 2.0,
    employment: '2.1% unemployment',
    employmentTrend: 'Strong',
    gdp: 0.8,
    gdpTrend: 'Moderate',
    tradeBalance: '+CHF 3.2B',
    consumerConfidence: -28.0,
    pmiManufacturing: 44.1,
    pmiServices: 50.3,
    centralBank: 'Swiss National Bank (SNB)',
    stance: 'Neutral',
    lastMeeting: 'Held at 1.75%',
    nextMeeting: '2026-09-26',
    marketExpectation: '55% probability of hold',
    rateTrajectory: 'Expected to hold, inflation near target',
  },
  AUD: {
    currency: 'AUD',
    interestRate: 4.35,
    rateTrend: 'Hawkish',
    cpi: 3.8,
    cpiTarget: 2.5,
    employment: '3.7% unemployment',
    employmentTrend: 'Solid',
    gdp: 1.5,
    gdpTrend: 'Moderate',
    tradeBalance: '+A$10.2B',
    consumerConfidence: 79.0,
    pmiManufacturing: 48.2,
    pmiServices: 51.8,
    centralBank: 'Reserve Bank of Australia (RBA)',
    stance: 'Hawkish',
    lastMeeting: 'Held at 4.35%',
    nextMeeting: '2026-09-05',
    marketExpectation: '75% probability of hold',
    rateTrajectory: 'Expected to hold, possible hike if CPI surprises',
  },
  CAD: {
    currency: 'CAD',
    interestRate: 5.00,
    rateTrend: 'Neutral',
    cpi: 3.1,
    cpiTarget: 2.0,
    employment: '5.8% unemployment',
    employmentTrend: 'Softening',
    gdp: 1.1,
    gdpTrend: 'Slowing',
    tradeBalance: '-C$1.1B',
    consumerConfidence: 48.2,
    pmiManufacturing: 48.6,
    pmiServices: 50.1,
    centralBank: 'Bank of Canada (BoC)',
    stance: 'Neutral',
    lastMeeting: 'Held at 5.00%',
    nextMeeting: '2026-09-04',
    marketExpectation: '65% probability of cut',
    rateTrajectory: 'Expected to begin easing cycle',
  },
  NZD: {
    currency: 'NZD',
    interestRate: 5.50,
    rateTrend: 'Hawkish',
    cpi: 4.7,
    cpiTarget: 2.0,
    employment: '3.9% unemployment',
    employmentTrend: 'Stable',
    gdp: 0.9,
    gdpTrend: 'Sluggish',
    tradeBalance: '-NZ$1.8B',
    consumerConfidence: 88.9,
    pmiManufacturing: 46.1,
    pmiServices: 51.2,
    centralBank: 'Reserve Bank of New Zealand (RBNZ)',
    stance: 'Hawkish',
    lastMeeting: 'Held at 5.50%',
    nextMeeting: '2026-10-09',
    marketExpectation: '80% probability of hold',
    rateTrajectory: 'Expected to hold well into 2027',
  },
  XAU: {
    currency: 'XAU',
    interestRate: 0.0,
    rateTrend: 'Non-yielding asset',
    cpi: 0.0,
    cpiTarget: 0.0,
    employment: 'Global safe haven demand',
    employmentTrend: 'Strong reserve accumulation',
    gdp: 0.0,
    gdpTrend: 'Hedge against currency debasement',
    tradeBalance: 'Central Bank Buying: +1,000t',
    consumerConfidence: 85.0,
    pmiManufacturing: 50.0,
    pmiServices: 50.0,
    centralBank: 'World Gold Council / Central Banks',
    stance: 'Hawkish',
    lastMeeting: 'De-dollarization & reserve expansion',
    nextMeeting: 'Ongoing 2026 Purchases',
    marketExpectation: 'High central bank net purchases',
    rateTrajectory: 'Bullish secular trend driven by real rates and geopolitics',
  },
};

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'XAU'];

const STANCE_COLOR: Record<Stance, string> = {
  Hawkish: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
  Neutral: 'bg-zinc-400/10 text-zinc-400 ring-zinc-400/20',
  Dovish: 'bg-red-400/10 text-red-400 ring-red-400/20',
};

// ---------------------------------------------------------------------------
// AI summaries per currency
// ---------------------------------------------------------------------------

const AI_SUMMARIES: Record<Currency, string> = {
  USD: 'USD fundamentals remain strong with elevated interest rates and resilient labor market. The Fed maintains a hawkish stance with rates at 5.50%. GDP growth at 2.1% outperforms peers. Manufacturing PMI below 50 signals contraction, but services sector remains expansionary.',
  EUR: 'EUR faces headwinds from weak GDP growth (0.3%) despite ECB rate hikes to 4.50%. Manufacturing PMI deeply in contraction territory at 44.8. The rate differential vs USD weighs on the currency. Markets pricing in potential rate cuts as growth falters.',
  GBP: 'GBP supported by sticky inflation at 4.0% keeping BoE hawkish with rates at 5.25%. Tight labor market prevents rate cuts despite near-zero GDP growth. The twin deficit (trade + budget) is a structural drag. Services PMI above 50 provides some support.',
  JPY: 'JPY remains weak due to massive yield differential with negative rates at -0.10%. BoJ is the last major dovish central bank. However, CPI at 3.3% and gradual YCC adjustments hint at eventual normalization. Any BoJ policy shift would be JPY-positive.',
  CHF: 'CHF benefits from safe-haven flows and low inflation at 1.7% near the SNB target. The SNB has scope to cut if needed. Strong trade surplus and low unemployment support the currency. Manufacturing weakness (PMI 44.1) is the primary concern.',
  AUD: 'AUD influenced heavily by China demand and commodity prices. RBA remains hawkish with inflation well above 2.5% target at 3.8%. Strong trade surplus from iron ore exports. Vulnerable to China economic slowdown.',
  CAD: 'CAD tied to oil prices and US economic cycle. BoC at 5.00% but markets expect easing as GDP growth slows to 1.1%. Employment softening provides cover for rate cuts. Trade balance turning negative adds pressure.',
  NZD: 'NZD fundamentals mixed with very high inflation (4.7%) keeping RBNZ hawkish at 5.50%. GDP growth sluggish at 0.9%. Manufacturing PMI deeply contractionary. High rates support carry trades but weigh on domestic growth.',
  XAU: 'Emas (XAU) didorong oleh arus safe-haven geopolitik, tren de-dolarisasi global, dan pembelian emas fisik agresif oleh bank-bank sentral dunia. Sebagai aset lindung nilai terhadap inflasi dan pelemahan mata uang fiat, prospek fundamental Emas jangka panjang tetap sangat bullish.',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function IndicatorCard({
  label,
  value,
  detail,
  positive,
}: {
  label: string;
  value: string;
  detail?: string;
  positive?: boolean | null;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-zinc-100">{value}</p>
      {detail && (
        <p
          className={`mt-0.5 text-[11px] ${
            positive === true
              ? 'text-emerald-400'
              : positive === false
                ? 'text-red-400'
                : 'text-zinc-500'
          }`}
        >
          {detail}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FundamentalPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [compareCurrency, setCompareCurrency] = useState<Currency>('EUR');
  const pairs = useForexStore((s) => s.pairs);

  const data = FUNDAMENTALS[selectedCurrency];
  const compareData = FUNDAMENTALS[compareCurrency];

  return (
    <div className="space-y-5">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Analisis Fundamental</span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Currency Selector                                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-wrap gap-1.5">
        {CURRENCIES.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCurrency(c)}
            className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
              selectedCurrency === c
                ? 'bg-blue-600 text-white'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Economic Indicators                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <BarChart3 className="h-4 w-4" />
          Indikator Ekonomi {selectedCurrency}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <IndicatorCard
            label="Suku Bunga"
            value={`${data.interestRate >= 0 ? '' : ''}${data.interestRate.toFixed(2)}%`}
            detail={data.rateTrend}
            positive={data.stance === 'Hawkish' ? true : data.stance === 'Dovish' ? false : null}
          />
          <IndicatorCard
            label="Inflasi (CPI)"
            value={`${data.cpi.toFixed(1)}%`}
            detail={
              data.cpi > data.cpiTarget
                ? `Di atas target ${data.cpiTarget}%`
                : data.cpi < data.cpiTarget
                  ? `Di bawah target ${data.cpiTarget}%`
                  : `Sesuai target ${data.cpiTarget}%`
            }
            positive={data.cpi <= data.cpiTarget}
          />
          <IndicatorCard
            label="Ketenagakerjaan"
            value={data.employment}
            detail={data.employmentTrend}
            positive={data.employmentTrend === 'Strong' || data.employmentTrend === 'Tight' || data.employmentTrend === 'Tight labor market' || data.employmentTrend === 'Solid' || data.employmentTrend === 'Stable'}
          />
          <IndicatorCard
            label="Pertumbuhan PDB (GDP)"
            value={`${data.gdp.toFixed(1)}%`}
            detail={data.gdpTrend}
            positive={data.gdp > 1}
          />
          <IndicatorCard
            label="Neraca Perdagangan"
            value={data.tradeBalance}
            positive={data.tradeBalance.startsWith('+')}
          />
          <IndicatorCard
            label="Keyakinan Konsumen"
            value={data.consumerConfidence.toFixed(1)}
            positive={data.consumerConfidence > 50 || (selectedCurrency === 'EUR' ? null : data.consumerConfidence > 0)}
          />
          <IndicatorCard
            label="PMI Manufaktur"
            value={data.pmiManufacturing.toFixed(1)}
            detail={data.pmiManufacturing >= 50 ? 'Ekspansi' : 'Kontraksi'}
            positive={data.pmiManufacturing >= 50}
          />
          <IndicatorCard
            label="PMI Jasa"
            value={data.pmiServices.toFixed(1)}
            detail={data.pmiServices >= 50 ? 'Ekspansi' : 'Kontraksi'}
            positive={data.pmiServices >= 50}
          />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Central Bank Analysis                                             */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Landmark className="h-4 w-4" />
          Central Bank Analysis
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-200">{data.centralBank}</span>
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-bold ring-1 ${STANCE_COLOR[data.stance]}`}
            >
              {data.stance}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded border border-zinc-800 bg-zinc-800/50 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Last Meeting</p>
              <p className="mt-0.5 text-sm text-zinc-300">{data.lastMeeting}</p>
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-800/50 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Next Meeting</p>
              <p className="mt-0.5 text-sm font-mono text-zinc-300">{data.nextMeeting}</p>
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-800/50 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Market Expectation</p>
              <p className="mt-0.5 text-sm text-zinc-300">{data.marketExpectation}</p>
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-800/50 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Rate Trajectory</p>
              <p className="mt-0.5 text-sm text-zinc-300">{data.rateTrajectory}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Fundamental Comparison                                            */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <ArrowRightLeft className="h-4 w-4" />
            Fundamental Comparison
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400">{selectedCurrency}</span>
            <span className="text-xs text-zinc-600">vs</span>
            <select
              value={compareCurrency}
              onChange={(e) => setCompareCurrency(e.target.value as Currency)}
              className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-blue-500 focus:outline-none"
            >
              {CURRENCIES.filter((c) => c !== selectedCurrency).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">Indicator</th>
                <th className="pb-2 text-right text-[11px] font-bold uppercase tracking-wide text-blue-400">{selectedCurrency}</th>
                <th className="pb-2 text-right text-[11px] font-bold uppercase tracking-wide text-amber-400">{compareCurrency}</th>
                <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wide text-zinc-500">Edge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {([
                { label: 'Interest Rate', a: `${data.interestRate.toFixed(2)}%`, b: `${compareData.interestRate.toFixed(2)}%`, aWins: data.interestRate > compareData.interestRate },
                { label: 'CPI Inflation', a: `${data.cpi.toFixed(1)}%`, b: `${compareData.cpi.toFixed(1)}%`, aWins: data.cpi < compareData.cpi },
                { label: 'GDP Growth', a: `${data.gdp.toFixed(1)}%`, b: `${compareData.gdp.toFixed(1)}%`, aWins: data.gdp > compareData.gdp },
                { label: 'PMI Mfg', a: data.pmiManufacturing.toFixed(1), b: compareData.pmiManufacturing.toFixed(1), aWins: data.pmiManufacturing > compareData.pmiManufacturing },
                { label: 'PMI Services', a: data.pmiServices.toFixed(1), b: compareData.pmiServices.toFixed(1), aWins: data.pmiServices > compareData.pmiServices },
                { label: 'CB Stance', a: data.stance, b: compareData.stance, aWins: null as boolean | null },
              ] as const).map((row) => (
                <tr key={row.label}>
                  <td className="py-2 text-zinc-400">{row.label}</td>
                  <td className="py-2 text-right font-mono text-zinc-200">{row.a}</td>
                  <td className="py-2 text-right font-mono text-zinc-200">{row.b}</td>
                  <td className="py-2 text-right">
                    {row.aWins === null ? (
                      <Minus className="ml-auto h-3.5 w-3.5 text-zinc-600" />
                    ) : row.aWins ? (
                      <span className="text-xs font-bold text-blue-400">{selectedCurrency}</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-400">{compareCurrency}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* AI Fundamental Summary                                            */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Brain className="h-4 w-4" />
          AI Fundamental Summary — {selectedCurrency}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-300">
          {AI_SUMMARIES[selectedCurrency]}
        </p>

        {selectedCurrency !== compareCurrency && (
          <div className="mt-3 rounded border border-zinc-800 bg-zinc-800/50 px-3 py-2">
            <p className="text-[11px] font-semibold text-zinc-400 mb-1">
              {selectedCurrency}/{compareCurrency} Outlook
            </p>
            <p className="text-sm text-zinc-300">
              {data.interestRate > compareData.interestRate
                ? `Rate differential of ${(data.interestRate - compareData.interestRate).toFixed(2)}% favors ${selectedCurrency}. `
                : data.interestRate < compareData.interestRate
                  ? `Rate differential of ${(compareData.interestRate - data.interestRate).toFixed(2)}% favors ${compareCurrency}. `
                  : 'Rate parity between the two currencies. '}
              {data.gdp > compareData.gdp
                ? `${selectedCurrency} has stronger GDP growth (${data.gdp}% vs ${compareData.gdp}%). `
                : `${compareCurrency} has stronger GDP growth (${compareData.gdp}% vs ${data.gdp}%). `}
              {data.stance === 'Hawkish' && compareData.stance !== 'Hawkish'
                ? `${selectedCurrency} central bank hawkishness provides support.`
                : compareData.stance === 'Hawkish' && data.stance !== 'Hawkish'
                  ? `${compareCurrency} central bank hawkishness provides headwinds.`
                  : 'Both central banks have similar policy stances.'}
            </p>
          </div>
        )}

        <p className="mt-2 text-[10px] text-zinc-600 italic">
          Generated analysis — not financial advice.
        </p>
      </section>
    </div>
  );
}
