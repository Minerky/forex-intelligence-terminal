// ⚠️ DEVELOPMENT DATA - Not real market data

import type {
  Currency,
  CurrencyPair,
  EconomicEvent,
  NewsItem,
  MarketSession,
  CurrencyStrength,
  CorrelationData,
  TimeframeAnalysis,
  Prediction,
  Signal,
  ScannerResult,
  Candle,
} from './types';

// ---------------------------------------------------------------------------
// Base prices – realistic mid-market rates
// ---------------------------------------------------------------------------

export const BASE_PRICES: Record<string, number> = {
  'XAU/USD': 2938.50,
  'EUR/USD': 1.1682,
  'GBP/USD': 1.3637,
  'USD/JPY': 158.95,
  'USD/CHF': 0.8009,
  'AUD/USD': 0.7164,
  'USD/CAD': 1.3763,
  'NZD/USD': 0.5979,
  'EUR/GBP': 0.8566,
  'EUR/JPY': 185.69,
  'GBP/JPY': 216.76,
};

// Pip size per pair (used for spread / simulation scale)
const pipSize = (symbol: string): number =>
  symbol.includes('XAU') ? 0.1 : symbol.includes('JPY') ? 0.01 : 0.0001;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function roundTo(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

function decimalsFor(symbol: string): number {
  return symbol.includes('JPY') || symbol.includes('XAU') ? 2 : 4;
}

// ---------------------------------------------------------------------------
// Build one CurrencyPair from a base price
// ---------------------------------------------------------------------------

interface PairSeed {
  symbol: string;
  base: Currency;
  quote: Currency;
  price: number;
  rsi: number;
  trend: CurrencyPair['trend'];
  sentiment: CurrencyPair['sentiment'];
}

const PAIR_SEEDS: PairSeed[] = [
  { symbol: 'XAU/USD', base: 'XAU', quote: 'USD', price: 2938.50, rsi: 65, trend: 'Bullish', sentiment: 'Very Bullish' },
  { symbol: 'EUR/USD', base: 'EUR', quote: 'USD', price: 1.1682, rsi: 55, trend: 'Bullish', sentiment: 'Bullish' },
  { symbol: 'GBP/USD', base: 'GBP', quote: 'USD', price: 1.3637, rsi: 58, trend: 'Bullish', sentiment: 'Bullish' },
  { symbol: 'USD/JPY', base: 'USD', quote: 'JPY', price: 158.95, rsi: 62, trend: 'Bullish', sentiment: 'Neutral' },
  { symbol: 'USD/CHF', base: 'USD', quote: 'CHF', price: 0.8009, rsi: 48, trend: 'Bearish', sentiment: 'Bearish' },
  { symbol: 'AUD/USD', base: 'AUD', quote: 'USD', price: 0.7164, rsi: 44, trend: 'Bearish', sentiment: 'Bearish' },
  { symbol: 'USD/CAD', base: 'USD', quote: 'CAD', price: 1.3763, rsi: 52, trend: 'Neutral', sentiment: 'Neutral' },
  { symbol: 'NZD/USD', base: 'NZD', quote: 'USD', price: 0.5979, rsi: 41, trend: 'Bearish', sentiment: 'Very Bearish' },
  { symbol: 'EUR/GBP', base: 'EUR', quote: 'GBP', price: 0.8566, rsi: 50, trend: 'Neutral', sentiment: 'Neutral' },
  { symbol: 'EUR/JPY', base: 'EUR', quote: 'JPY', price: 185.69, rsi: 60, trend: 'Bullish', sentiment: 'Bullish' },
  { symbol: 'GBP/JPY', base: 'GBP', quote: 'JPY', price: 216.76, rsi: 63, trend: 'Bullish', sentiment: 'Very Bullish' },
];

function buildPair(s: PairSeed): CurrencyPair {
  const d = decimalsFor(s.symbol);
  const pip = pipSize(s.symbol);
  const spreadPips = s.symbol.includes('JPY') ? rand(1.2, 3.0) : rand(0.8, 2.0);
  const spread = roundTo(spreadPips * pip, d + 1);
  const bid = roundTo(s.price - spread / 2, d);
  const ask = roundTo(s.price + spread / 2, d);
  const dailyRange = s.symbol.includes('JPY') ? rand(0.40, 1.20) : rand(0.0030, 0.0090);
  const open = roundTo(s.price + (Math.random() > 0.5 ? -1 : 1) * rand(0, dailyRange * 0.3), d);
  const change = roundTo(s.price - open, d);
  const changePercent = roundTo((change / open) * 100, 2);
  const high = roundTo(Math.max(s.price, open) + rand(0, dailyRange * 0.4), d);
  const low = roundTo(Math.min(s.price, open) - rand(0, dailyRange * 0.4), d);
  const prevClose = roundTo(open + (Math.random() > 0.5 ? -1 : 1) * rand(0, dailyRange * 0.1), d);
  const atr = roundTo(dailyRange * rand(0.8, 1.2), d);

  // MACD scaled to price: for JPY pairs values are larger
  const macdScale = s.symbol.includes('JPY') ? 0.1 : 0.001;
  const macdValue = roundTo((s.rsi > 50 ? 1 : -1) * rand(0.2, 1.5) * macdScale, d + 1);
  const macdSignal = roundTo(macdValue - (s.rsi > 50 ? 1 : -1) * rand(0, 0.5) * macdScale, d + 1);
  const macdHistogram = roundTo(macdValue - macdSignal, d + 1);

  const volatility: CurrencyPair['volatility'] =
    atr > dailyRange ? 'High' : atr > dailyRange * 0.5 ? 'Medium' : 'Low';

  const aiScore = roundTo(
    clamp(50 + (s.rsi - 50) * 0.4 + (macdHistogram > 0 ? 8 : -8) + rand(-5, 5), 10, 95),
    0,
  );

  return {
    symbol: s.symbol,
    base: s.base,
    quote: s.quote,
    bid,
    ask,
    spread: roundTo(spread, d + 1),
    price: roundTo(s.price, d),
    change,
    changePercent,
    high,
    low,
    open,
    previousClose: prevClose,
    atr,
    rsi: roundTo(clamp(s.rsi + rand(-3, 3), 15, 85), 1),
    macd: { value: macdValue, signal: macdSignal, histogram: macdHistogram },
    trend: s.trend,
    volatility,
    sentiment: s.sentiment,
    aiScore,
    timestamp: Date.now(),
  };
}

export const CURRENCY_PAIRS: CurrencyPair[] = PAIR_SEEDS.map(buildPair);

// ---------------------------------------------------------------------------
// Economic Events (15 realistic entries for the week)
// ---------------------------------------------------------------------------

export const ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'ev-001', date: '2026-08-24', time: '08:30', currency: 'USD', country: 'United States',
    event: 'Core PCE Price Index m/m', impact: 'High', forecast: '0.2%', previous: '0.3%',
    actual: '', deviation: '', relatedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
    historicalImpact: '±35 pips on EUR/USD', avgVolatility: '42 pips',
    typicalReaction: 'Higher than expected = USD bullish', historicalWinRate: 68,
    aiInterpretation: 'Market expects cooling inflation; a miss could spark USD selling.',
  },
  {
    id: 'ev-002', date: '2026-08-24', time: '10:00', currency: 'USD', country: 'United States',
    event: 'CB Consumer Confidence', impact: 'Medium', forecast: '103.5', previous: '100.4',
    actual: '', deviation: '', relatedPairs: ['EUR/USD', 'USD/CAD'],
    historicalImpact: '±18 pips on EUR/USD', avgVolatility: '22 pips',
    typicalReaction: 'Higher = USD bullish', historicalWinRate: 55,
    aiInterpretation: 'Sentiment gauge; unlikely to move markets unless a large beat/miss.',
  },
  {
    id: 'ev-003', date: '2026-08-25', time: '04:30', currency: 'GBP', country: 'United Kingdom',
    event: 'CPI y/y', impact: 'High', forecast: '2.8%', previous: '3.0%',
    actual: '', deviation: '', relatedPairs: ['GBP/USD', 'EUR/GBP', 'GBP/JPY'],
    historicalImpact: '±55 pips on GBP/USD', avgVolatility: '60 pips',
    typicalReaction: 'Higher = GBP bullish (BoE rate hold)', historicalWinRate: 64,
    aiInterpretation: 'Key for BoE rate path. A sticky reading keeps hikes on the table.',
  },
  {
    id: 'ev-004', date: '2026-08-25', time: '10:00', currency: 'USD', country: 'United States',
    event: 'New Home Sales', impact: 'Low', forecast: '640K', previous: '619K',
    actual: '', deviation: '', relatedPairs: ['USD/CAD'],
    historicalImpact: '±8 pips on USD index', avgVolatility: '10 pips',
    typicalReaction: 'Marginal USD reaction', historicalWinRate: 50,
    aiInterpretation: 'Housing data is secondary; watch for trend confirmation only.',
  },
  {
    id: 'ev-005', date: '2026-08-25', time: '14:00', currency: 'USD', country: 'United States',
    event: 'FOMC Meeting Minutes', impact: 'High', forecast: '', previous: '',
    actual: '', deviation: '', relatedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF'],
    historicalImpact: '±45 pips on EUR/USD', avgVolatility: '55 pips',
    typicalReaction: 'Hawkish tone = USD bullish', historicalWinRate: 60,
    aiInterpretation: 'Markets scanning for rate-cut timing clues. High volatility expected.',
  },
  {
    id: 'ev-006', date: '2026-08-26', time: '01:30', currency: 'AUD', country: 'Australia',
    event: 'CPI y/y', impact: 'High', forecast: '3.4%', previous: '3.6%',
    actual: '', deviation: '', relatedPairs: ['AUD/USD', 'NZD/USD'],
    historicalImpact: '±40 pips on AUD/USD', avgVolatility: '48 pips',
    typicalReaction: 'Higher = AUD bullish', historicalWinRate: 62,
    aiInterpretation: 'RBA watching closely. A beat strengthens case against cuts.',
  },
  {
    id: 'ev-007', date: '2026-08-26', time: '08:30', currency: 'USD', country: 'United States',
    event: 'GDP q/q (Preliminary)', impact: 'High', forecast: '2.4%', previous: '1.4%',
    actual: '', deviation: '', relatedPairs: ['EUR/USD', 'USD/JPY', 'GBP/USD'],
    historicalImpact: '±40 pips on EUR/USD', avgVolatility: '50 pips',
    typicalReaction: 'Higher = USD bullish', historicalWinRate: 63,
    aiInterpretation: 'Growth data crucial for Fed outlook. Strong GDP = delayed cuts.',
  },
  {
    id: 'ev-008', date: '2026-08-26', time: '08:30', currency: 'USD', country: 'United States',
    event: 'Unemployment Claims', impact: 'Medium', forecast: '218K', previous: '222K',
    actual: '', deviation: '', relatedPairs: ['EUR/USD', 'USD/JPY'],
    historicalImpact: '±15 pips on EUR/USD', avgVolatility: '18 pips',
    typicalReaction: 'Lower claims = USD bullish', historicalWinRate: 52,
    aiInterpretation: 'Labor market health check. Only big surprises move the needle.',
  },
  {
    id: 'ev-009', date: '2026-08-26', time: '19:30', currency: 'JPY', country: 'Japan',
    event: 'Tokyo CPI y/y', impact: 'High', forecast: '2.3%', previous: '2.2%',
    actual: '', deviation: '', relatedPairs: ['USD/JPY', 'EUR/JPY', 'GBP/JPY'],
    historicalImpact: '±50 pips on USD/JPY', avgVolatility: '55 pips',
    typicalReaction: 'Higher = JPY bullish (BoJ tightening)', historicalWinRate: 58,
    aiInterpretation: 'Leading indicator for national CPI. BoJ hawks watching carefully.',
  },
  {
    id: 'ev-010', date: '2026-08-27', time: '04:00', currency: 'EUR', country: 'Eurozone',
    event: 'CPI Flash Estimate y/y', impact: 'High', forecast: '2.5%', previous: '2.6%',
    actual: '', deviation: '', relatedPairs: ['EUR/USD', 'EUR/GBP', 'EUR/JPY'],
    historicalImpact: '±35 pips on EUR/USD', avgVolatility: '40 pips',
    typicalReaction: 'Higher = EUR bullish', historicalWinRate: 60,
    aiInterpretation: 'ECB rate decision driver. Disinflation trend supportive for cuts.',
  },
  {
    id: 'ev-011', date: '2026-08-27', time: '08:30', currency: 'CAD', country: 'Canada',
    event: 'GDP m/m', impact: 'Medium', forecast: '0.2%', previous: '0.0%',
    actual: '', deviation: '', relatedPairs: ['USD/CAD'],
    historicalImpact: '±25 pips on USD/CAD', avgVolatility: '30 pips',
    typicalReaction: 'Higher = CAD bullish', historicalWinRate: 56,
    aiInterpretation: 'BoC watching growth closely after rate cuts. Weak data = more easing.',
  },
  {
    id: 'ev-012', date: '2026-08-27', time: '08:30', currency: 'USD', country: 'United States',
    event: 'Core PCE Price Index y/y', impact: 'Extreme', forecast: '2.6%', previous: '2.6%',
    actual: '', deviation: '', relatedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF'],
    historicalImpact: '±50 pips on EUR/USD', avgVolatility: '65 pips',
    typicalReaction: 'Lower = USD bearish (rate cuts)', historicalWinRate: 70,
    aiInterpretation: 'Fed\'s preferred inflation gauge. THE event of the week.',
  },
  {
    id: 'ev-013', date: '2026-08-27', time: '10:00', currency: 'USD', country: 'United States',
    event: 'U. of Michigan Consumer Sentiment (Final)', impact: 'Medium', forecast: '67.8', previous: '66.4',
    actual: '', deviation: '', relatedPairs: ['EUR/USD'],
    historicalImpact: '±12 pips on EUR/USD', avgVolatility: '15 pips',
    typicalReaction: 'Higher = USD bullish', historicalWinRate: 50,
    aiInterpretation: 'Watch inflation expectations component more than headline.',
  },
  {
    id: 'ev-014', date: '2026-08-25', time: '09:00', currency: 'CHF', country: 'Switzerland',
    event: 'SNB Interest Rate Decision', impact: 'Extreme', forecast: '1.25%', previous: '1.50%',
    actual: '', deviation: '', relatedPairs: ['USD/CHF', 'EUR/CHF'],
    historicalImpact: '±70 pips on USD/CHF', avgVolatility: '80 pips',
    typicalReaction: 'Rate cut = CHF bearish', historicalWinRate: 72,
    aiInterpretation: 'Market pricing 25bp cut. Any hold would shock CHF higher.',
  },
  {
    id: 'ev-015', date: '2026-08-28', time: '21:45', currency: 'NZD', country: 'New Zealand',
    event: 'Building Consents m/m', impact: 'Low', forecast: '2.1%', previous: '-0.8%',
    actual: '', deviation: '', relatedPairs: ['NZD/USD'],
    historicalImpact: '±5 pips on NZD/USD', avgVolatility: '6 pips',
    typicalReaction: 'Minimal reaction', historicalWinRate: 48,
    aiInterpretation: 'Low-tier housing data. Ignore unless combined with other NZD news.',
  },
];

// ---------------------------------------------------------------------------
// News Items (10 realistic items)
// ---------------------------------------------------------------------------

const now = Date.now();

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'news-001', timestamp: now - 12 * 60_000,
    headline: 'Fed Officials Signal Patience on Rate Cuts Despite Cooling Inflation',
    summary: 'Multiple FOMC members emphasized data dependency and cautioned against premature easing, noting that services inflation remains sticky above the 2% target.',
    source: 'Reuters', category: 'Central Banks', importance: 'High',
    affectedCurrencies: ['USD', 'EUR', 'GBP'], bullishCurrencies: ['USD'], bearishCurrencies: ['EUR', 'GBP'],
    potentialImpact: 'USD strength on hawkish hold narrative', timeHorizon: '1-3 days',
    confidenceScore: 78, sentiment: 'Bullish',
  },
  {
    id: 'news-002', timestamp: now - 45 * 60_000,
    headline: 'BoJ Governor Ueda Hints at Further Policy Normalization',
    summary: 'Governor Ueda stated the Bank of Japan will continue adjusting policy if inflation stays on track, boosting expectations of another rate hike by Q4.',
    source: 'Nikkei', category: 'Central Banks', importance: 'Critical',
    affectedCurrencies: ['JPY', 'USD'], bullishCurrencies: ['JPY'], bearishCurrencies: ['USD'],
    potentialImpact: 'JPY strengthening, pressure on USD/JPY carry trades', timeHorizon: '1-2 weeks',
    confidenceScore: 82, sentiment: 'Bearish',
  },
  {
    id: 'news-003', timestamp: now - 90 * 60_000,
    headline: 'UK Wage Growth Accelerates, Complicating BoE Rate Path',
    summary: 'Average earnings excluding bonuses rose 5.7% y/y, exceeding the 5.4% forecast and keeping inflationary pressure elevated in the UK labor market.',
    source: 'Financial Times', category: 'Economic Data', importance: 'High',
    affectedCurrencies: ['GBP', 'EUR'], bullishCurrencies: ['GBP'], bearishCurrencies: [],
    potentialImpact: 'GBP supported on higher-for-longer BoE expectations', timeHorizon: '1-5 days',
    confidenceScore: 74, sentiment: 'Bullish',
  },
  {
    id: 'news-004', timestamp: now - 3 * 3600_000,
    headline: 'China PMI Disappoints, Weighing on Risk-Sensitive Currencies',
    summary: 'Manufacturing PMI fell to 49.1 from 49.5, signaling continued contraction. Services PMI also missed at 51.2 vs 52.0 expected.',
    source: 'Bloomberg', category: 'Economic Data', importance: 'High',
    affectedCurrencies: ['AUD', 'NZD', 'JPY'], bullishCurrencies: ['JPY'], bearishCurrencies: ['AUD', 'NZD'],
    potentialImpact: 'Risk-off pressure on AUD and NZD', timeHorizon: '1-3 days',
    confidenceScore: 80, sentiment: 'Bearish',
  },
  {
    id: 'news-005', timestamp: now - 5 * 3600_000,
    headline: 'ECB Lagarde: September Cut Not a Foregone Conclusion',
    summary: 'President Lagarde pushed back on market pricing for a September rate cut, saying the Governing Council remains data-dependent.',
    source: 'ECB Press Conference', category: 'Central Banks', importance: 'High',
    affectedCurrencies: ['EUR', 'USD'], bullishCurrencies: ['EUR'], bearishCurrencies: [],
    potentialImpact: 'EUR gains if rate cut repriced out', timeHorizon: '2-4 weeks',
    confidenceScore: 70, sentiment: 'Bullish',
  },
  {
    id: 'news-006', timestamp: now - 7 * 3600_000,
    headline: 'Canadian Housing Starts Surge to 14-Month High',
    summary: 'Housing starts jumped to 262K annualized, beating the 240K forecast and suggesting resilient demand despite higher mortgage rates.',
    source: 'Statistics Canada', category: 'Economic Data', importance: 'Medium',
    affectedCurrencies: ['CAD', 'USD'], bullishCurrencies: ['CAD'], bearishCurrencies: [],
    potentialImpact: 'Mild CAD support; watch USD/CAD for confirmation', timeHorizon: '1-2 days',
    confidenceScore: 60, sentiment: 'Bullish',
  },
  {
    id: 'news-007', timestamp: now - 10 * 3600_000,
    headline: 'Swiss National Bank Expected to Cut Rates Again Thursday',
    summary: 'Markets are pricing an 85% probability of a 25bp cut to 1.25%. The franc has weakened in anticipation.',
    source: 'Reuters', category: 'Central Banks', importance: 'High',
    affectedCurrencies: ['CHF', 'EUR'], bullishCurrencies: [], bearishCurrencies: ['CHF'],
    potentialImpact: 'CHF weakness; USD/CHF rally if confirmed', timeHorizon: '1-3 days',
    confidenceScore: 85, sentiment: 'Bearish',
  },
  {
    id: 'news-008', timestamp: now - 14 * 3600_000,
    headline: 'US Treasury Yields Climb as Auction Demand Softens',
    summary: 'The 10-year yield rose 8bp to 4.32% after a weak 5-year auction saw a tail of 1.2bp, reflecting reduced foreign demand.',
    source: 'MarketWatch', category: 'Fixed Income', importance: 'Medium',
    affectedCurrencies: ['USD', 'JPY'], bullishCurrencies: ['USD'], bearishCurrencies: ['JPY'],
    potentialImpact: 'Rising yields support USD, weigh on JPY', timeHorizon: '1-3 days',
    confidenceScore: 65, sentiment: 'Bullish',
  },
  {
    id: 'news-009', timestamp: now - 18 * 3600_000,
    headline: 'RBNZ Assistant Governor Signals Comfort with Current Policy Stance',
    summary: 'Remarks suggest the RBNZ is content holding rates at 5.50% until clear evidence of inflation returning to the 1-3% band.',
    source: 'RBNZ', category: 'Central Banks', importance: 'Medium',
    affectedCurrencies: ['NZD'], bullishCurrencies: [], bearishCurrencies: ['NZD'],
    potentialImpact: 'Neutral to mildly bearish NZD; high rates but slowing economy', timeHorizon: '1-4 weeks',
    confidenceScore: 58, sentiment: 'Neutral',
  },
  {
    id: 'news-010', timestamp: now - 22 * 3600_000,
    headline: 'Geopolitical Tensions Flare in Middle East, Safe Havens Bid',
    summary: 'Escalation in the Red Sea shipping corridor has triggered safe-haven flows into CHF, JPY, and gold while pressuring risk currencies.',
    source: 'Al Jazeera', category: 'Geopolitics', importance: 'Critical',
    affectedCurrencies: ['JPY', 'CHF', 'AUD', 'NZD'], bullishCurrencies: ['JPY', 'CHF'], bearishCurrencies: ['AUD', 'NZD'],
    potentialImpact: 'Significant if sustained; watch oil and VIX', timeHorizon: '1-7 days',
    confidenceScore: 72, sentiment: 'Very Bearish',
  },
];

// ---------------------------------------------------------------------------
// Market Sessions
// ---------------------------------------------------------------------------

export const MARKET_SESSIONS: MarketSession[] = [
  { name: 'Sydney', status: 'Closed', open: '22:00', close: '07:00', timezone: 'AEST (UTC+10)' },
  { name: 'Tokyo', status: 'Closed', open: '00:00', close: '09:00', timezone: 'JST (UTC+9)' },
  { name: 'London', status: 'Open', open: '08:00', close: '17:00', timezone: 'BST (UTC+1)' },
  { name: 'New York', status: 'Open', open: '13:00', close: '22:00', timezone: 'EDT (UTC-4)' },
];

// ---------------------------------------------------------------------------
// Generator functions
// ---------------------------------------------------------------------------

export function generateCurrencyStrength(): CurrencyStrength[] {
  const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];

  // Base strengths roughly consistent with pair seeds
  const baseStrengths: Record<Currency, number> = {
    USD: 65, EUR: 55, GBP: 60, JPY: 45, CHF: 42, AUD: 38, CAD: 48, NZD: 35,
  };

  const data: CurrencyStrength[] = currencies.map((c) => {
    const s = baseStrengths[c] + rand(-5, 5);
    return {
      currency: c,
      strength: roundTo(clamp(s, 10, 95), 1),
      momentum: roundTo(rand(-3, 3), 2),
      rsiAvg: roundTo(clamp(s + rand(-8, 8), 25, 75), 1),
      change1h: roundTo(rand(-0.15, 0.15), 2),
      change4h: roundTo(rand(-0.4, 0.4), 2),
      change1d: roundTo(rand(-0.8, 0.8), 2),
      rank: 0,
    };
  });

  data.sort((a, b) => b.strength - a.strength);
  data.forEach((d, i) => { d.rank = i + 1; });
  return data;
}

export function generateCorrelationMatrix(): CorrelationData[] {
  // Known realistic correlations (approximate)
  const known: [string, string, number][] = [
    ['EUR/USD', 'GBP/USD', 0.85],
    ['EUR/USD', 'USD/CHF', -0.92],
    ['EUR/USD', 'AUD/USD', 0.68],
    ['EUR/USD', 'NZD/USD', 0.65],
    ['EUR/USD', 'USD/CAD', -0.55],
    ['EUR/USD', 'USD/JPY', -0.30],
    ['GBP/USD', 'EUR/GBP', -0.50],
    ['GBP/USD', 'AUD/USD', 0.60],
    ['USD/JPY', 'EUR/JPY', 0.45],
    ['USD/JPY', 'GBP/JPY', 0.50],
    ['AUD/USD', 'NZD/USD', 0.92],
    ['EUR/JPY', 'GBP/JPY', 0.90],
  ];

  return known.map(([p1, p2, base]) => {
    const jitter = () => roundTo(clamp(base + rand(-0.08, 0.08), -1, 1), 2);
    return {
      pair1: p1,
      pair2: p2,
      correlation1h: jitter(),
      correlation4h: jitter(),
      correlationDaily: roundTo(base, 2),
      correlationWeekly: roundTo(clamp(base + rand(-0.05, 0.05), -1, 1), 2),
    };
  });
}

export function generateTimeframeAnalysis(pair: string): TimeframeAnalysis[] {
  const pairData = CURRENCY_PAIRS.find((p) => p.symbol === pair) ?? CURRENCY_PAIRS[0];
  const d = decimalsFor(pairData.symbol);
  const spread = pairData.high - pairData.low || pipSize(pairData.symbol) * 50;
  const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];

  return timeframes.map((tf) => {
    // Higher timeframes drift toward the seed trend
    const bullishBias = pairData.trend === 'Bullish' ? 0.6 : pairData.trend === 'Bearish' ? 0.3 : 0.5;
    const r = Math.random();
    const trend: TimeframeAnalysis['trend'] = r < bullishBias ? 'Bullish' : r < bullishBias + 0.15 ? 'Neutral' : 'Bearish';
    const rsi = roundTo(clamp(pairData.rsi + rand(-12, 12), 20, 80), 1);
    const macd: TimeframeAnalysis['macd'] = trend === 'Bullish' ? 'Bullish' : trend === 'Bearish' ? 'Bearish' : 'Neutral';
    const momentum: TimeframeAnalysis['momentum'] = rsi > 60 || rsi < 40 ? 'Strong' : rsi > 55 || rsi < 45 ? 'Moderate' : 'Weak';
    const vol: TimeframeAnalysis['volatility'] = pairData.volatility;
    const signal: TimeframeAnalysis['signal'] = trend === 'Bullish' ? 'Buy' : trend === 'Bearish' ? 'Sell' : 'Hold';
    const support = roundTo(pairData.low - rand(0, spread * 0.3), d);
    const resistance = roundTo(pairData.high + rand(0, spread * 0.3), d);
    const confidence = roundTo(clamp(50 + (rsi > 60 || rsi < 40 ? 15 : 0) + rand(-10, 10), 30, 90), 0);

    return { timeframe: tf, trend, momentum, volatility: vol, rsi, macd, support, resistance, signal, confidence };
  });
}

export function generatePrediction(pair: string, pairData: CurrencyPair): Prediction {
  const d = decimalsFor(pair);
  const pip = pipSize(pair);

  // Strict Institutional Confluence Scoring
  let bullConfluence = 0;
  let bearConfluence = 0;
  const reasons: string[] = [];
  const riskFactors: string[] = [];

  // 1. Trend Filter
  if (pairData.trend === 'Bullish') {
    bullConfluence += 30;
    reasons.push('Tren pasar dominan terkonfirmasi Bullish');
  } else if (pairData.trend === 'Bearish') {
    bearConfluence += 30;
    reasons.push('Tren pasar dominan terkonfirmasi Bearish');
  } else {
    riskFactors.push('Tren pasar konsolidasi / sideways (risiko choppy market)');
  }

  // 2. RSI Healthy Momentum Zone (Avoid buying at peak >70 or selling at bottom <30)
  if (pairData.rsi >= 52 && pairData.rsi <= 68) {
    bullConfluence += 25;
    reasons.push(`RSI (${pairData.rsi}) berada di zona momentum bullish sehat (bukan overbought)`);
  } else if (pairData.rsi >= 32 && pairData.rsi <= 48) {
    bearConfluence += 25;
    reasons.push(`RSI (${pairData.rsi}) berada di zona momentum bearish sehat (bukan oversold)`);
  } else if (pairData.rsi > 70) {
    riskFactors.push(`RSI (${pairData.rsi}) Overbought ekstrem — dilarang BUY karena rawan koreksi instan`);
  } else if (pairData.rsi < 30) {
    riskFactors.push(`RSI (${pairData.rsi}) Oversold ekstrem — dilarang SELL karena rawan technical bounce`);
  }

  // 3. MACD Histogram Confirmation
  if (pairData.macd.histogram > 0) {
    bullConfluence += 25;
    reasons.push('Histogram MACD di atas nol mengonfirmasi ekspansi pembeli');
  } else if (pairData.macd.histogram < 0) {
    bearConfluence += 25;
    reasons.push('Histogram MACD di bawah nol mengonfirmasi ekspansi penjual');
  }

  // 4. Intraday Price Position vs Open
  if (pairData.price > pairData.open) {
    bullConfluence += 20;
    reasons.push('Harga berjalan di atas level Open harian');
  } else if (pairData.price < pairData.open) {
    bearConfluence += 20;
    reasons.push('Harga berjalan di bawah level Open harian');
  }

  // Strict Threshold: Only issue BUY/SELL if Confluence >= 75%, otherwise ALWAYS WAIT
  let direction: Prediction['direction'] = 'Neutral';
  let verdict: Prediction['verdict'] = 'WAIT';
  let confidence = 50;

  if (bullConfluence >= 75 && pairData.rsi <= 70) {
    direction = 'Bullish';
    verdict = 'BUY';
    confidence = Math.min(94, bullConfluence + Math.round(Math.random() * 4));
  } else if (bearConfluence >= 75 && pairData.rsi >= 30) {
    direction = 'Bearish';
    verdict = 'SELL';
    confidence = Math.min(94, bearConfluence + Math.round(Math.random() * 4));
  } else {
    direction = 'Neutral';
    verdict = 'WAIT';
    confidence = 45;
    reasons.push('Konfluensi indikator belum mencapai syarat 80% — Mode perlindungan modal WAIT aktif.');
  }

  const bullPct = verdict === 'BUY' ? confidence : verdict === 'SELL' ? 100 - confidence : 33;
  const bearPct = verdict === 'SELL' ? confidence : verdict === 'BUY' ? 100 - confidence : 33;
  const neutPct = Math.max(0, 100 - bullPct - bearPct);

  // Exact ATR based risk-reward (Minimum 1:2 Ratio)
  const isGold = pair.includes('XAU');
  const atrVal = pairData.atr || (isGold ? 15.0 : pair.includes('JPY') ? 0.8 : 0.006);
  const support = roundTo(pairData.low - atrVal * 0.5, d);
  const resistance = roundTo(pairData.high + atrVal * 0.5, d);

  const stopDist = atrVal * 1.0;
  const targetDist = atrVal * 2.2; // 1:2.2 R:R Ratio

  const target = verdict === 'BUY'
    ? roundTo(pairData.price + targetDist, d)
    : verdict === 'SELL'
      ? roundTo(pairData.price - targetDist, d)
      : roundTo(pairData.price + targetDist, d);

  const invalidation = verdict === 'BUY'
    ? roundTo(pairData.price - stopDist, d)
    : verdict === 'SELL'
      ? roundTo(pairData.price + stopDist, d)
      : roundTo(pairData.price - stopDist, d);

  const riskReward = roundTo(targetDist / (stopDist || 1), 2);

  const atrPips = atrVal / pip;
  riskFactors.push(`Jarak toleransi Cut Loss diatur pada 1x ATR (${roundTo(atrPips, 0)} pips)`);
  riskFactors.push('Waspadai lonjakan spread saat peralihan sesi atau rilis berita ekonomi berdampak tinggi');

  const expectedVol: Prediction['expectedVolatility'] = pairData.volatility;
  const marketRegime = pairData.volatility === 'High' ? 'Trending-Volatile' : pairData.trend === 'Neutral' ? 'Range-Bound' : 'Trending-Calm';

  return {
    pair,
    direction,
    bullishProbability: bullPct,
    bearishProbability: bearPct,
    neutralProbability: neutPct,
    confidence,
    expectedVolatility: expectedVol,
    support,
    resistance,
    target,
    invalidation,
    riskReward,
    timeHorizon: '1H - 4H',
    reasons,
    riskFactors,
    verdict,
    timestamp: Date.now(),
    modelVersion: 'FIT-Confluence-v4.0',
    marketRegime,
  };
}

export function generateSignals(pairsList?: CurrencyPair[]): Signal[] {
  const source = pairsList && pairsList.length > 0 ? pairsList : CURRENCY_PAIRS;
  return source.slice(0, 7).map((p) => {
    const prediction = generatePrediction(p.symbol, p);
    const techScore = prediction.verdict === 'BUY' || prediction.verdict === 'SELL' ? prediction.confidence : 45;
    const fundScore = roundTo(rand(45, 75), 0);
    const sentScore = prediction.verdict === 'BUY' ? 82 : prediction.verdict === 'SELL' ? 24 : 50;
    const mktStructScore = roundTo(rand(60, 85), 0);
    const volScore = p.volatility === 'High' ? 75 : 55;
    const newsScr = roundTo(rand(40, 70), 0);
    const total = roundTo((techScore * 0.35 + fundScore * 0.2 + sentScore * 0.15 + mktStructScore * 0.15 + volScore * 0.1 + newsScr * 0.05), 0);

    const d = decimalsFor(p.symbol);
    const entry = p.price;

    return {
      id: `sig-${p.symbol.replace('/', '')}`,
      pair: p.symbol,
      direction: prediction.verdict,
      technicalScore: techScore,
      fundamentalScore: fundScore,
      sentimentScore: sentScore,
      marketStructureScore: mktStructScore,
      volatilityScore: volScore,
      newsScore: newsScr,
      totalScore: total,
      confidence: prediction.confidence,
      entry: roundTo(entry, d),
      stopLoss: prediction.invalidation,
      takeProfit: prediction.target,
      riskReward: prediction.riskReward,
      timestamp: Date.now(),
      reasoning: prediction.reasons.join('. ') + '.',
    };
  });
}

export function generateScannerResults(): ScannerResult[] {
  const conditions = [
    { cond: 'Golden Cross (EMA 50/200)', dir: 'Bullish' as const },
    { cond: 'Death Cross (EMA 50/200)', dir: 'Bearish' as const },
    { cond: 'RSI Oversold Bounce', dir: 'Bullish' as const },
    { cond: 'RSI Overbought Reversal', dir: 'Bearish' as const },
    { cond: 'MACD Bullish Crossover', dir: 'Bullish' as const },
    { cond: 'MACD Bearish Crossover', dir: 'Bearish' as const },
    { cond: 'Breakout Above Resistance', dir: 'Bullish' as const },
    { cond: 'Breakdown Below Support', dir: 'Bearish' as const },
    { cond: 'Bullish Engulfing on H4', dir: 'Bullish' as const },
    { cond: 'Bearish Pin Bar on D1', dir: 'Bearish' as const },
  ];

  const count = Math.floor(rand(4, 8));
  const results: ScannerResult[] = [];

  for (let i = 0; i < count; i++) {
    const pair = pick(CURRENCY_PAIRS);
    const c = pick(conditions);
    results.push({
      pair: pair.symbol,
      condition: c.cond,
      direction: c.dir,
      score: roundTo(rand(55, 92), 0),
      details: `Detected on ${pair.symbol} at ${roundTo(pair.price, decimalsFor(pair.symbol))}. ATR: ${pair.atr}. RSI: ${pair.rsi}.`,
      timestamp: Date.now() - Math.floor(rand(0, 3600_000)),
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function generateCandles(pair: string, count: number): Candle[] {
  const base = BASE_PRICES[pair] ?? 1.0;
  const d = decimalsFor(pair);
  const pip = pipSize(pair);
  const volatility = pip * rand(20, 60); // per-candle range in price units

  const candles: Candle[] = [];
  const interval = 3600_000; // 1-hour candles
  let price = base;

  for (let i = count - 1; i >= 0; i--) {
    const time = Date.now() - i * interval;
    const drift = (Math.random() - 0.5) * volatility * 2;
    const open = roundTo(price, d);
    const close = roundTo(price + drift, d);
    const highExtra = rand(0, volatility * 0.6);
    const lowExtra = rand(0, volatility * 0.6);
    const high = roundTo(Math.max(open, close) + highExtra, d);
    const low = roundTo(Math.min(open, close) - lowExtra, d);
    const volume = Math.floor(rand(800, 5000));

    candles.push({ time: Math.floor(time / 1000), open, high, low, close, volume });
    price = close;
  }

  return candles;
}

export function simulatePriceUpdate(pair: CurrencyPair): CurrencyPair {
  const d = decimalsFor(pair.symbol);
  const pip = pipSize(pair.symbol);
  const maxMove = pip * rand(1, 5); // 1-5 pips per tick
  const direction = Math.random() > 0.5 ? 1 : -1;
  const move = roundTo(direction * maxMove, d + 1);

  const price = roundTo(pair.price + move, d);
  const spreadVal = pair.spread;
  const bid = roundTo(price - spreadVal / 2, d);
  const ask = roundTo(price + spreadVal / 2, d);
  const high = roundTo(Math.max(pair.high, price), d);
  const low = roundTo(Math.min(pair.low, price), d);
  const change = roundTo(price - pair.open, d);
  const changePercent = roundTo((change / pair.open) * 100, 2);

  // Nudge RSI slightly toward current direction
  const rsiShift = direction * rand(0, 0.3);
  const rsi = roundTo(clamp(pair.rsi + rsiShift, 15, 85), 1);

  // Slight MACD drift
  const histShift = direction * rand(0, pip * 0.5);
  const macdHist = roundTo(pair.macd.histogram + histShift, d + 1);
  const macdValue = roundTo(pair.macd.signal + macdHist, d + 1);

  return {
    ...pair,
    price,
    bid,
    ask,
    high,
    low,
    change,
    changePercent,
    rsi,
    macd: { value: macdValue, signal: pair.macd.signal, histogram: macdHist },
    timestamp: Date.now(),
  };
}
