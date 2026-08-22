// Currency and pair types
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'AUD' | 'CAD' | 'NZD';

export interface CurrencyPair {
  symbol: string;
  base: Currency;
  quote: Currency;
  bid: number;
  ask: number;
  spread: number;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  atr: number;
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  volatility: 'Low' | 'Medium' | 'High';
  sentiment: 'Very Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Very Bearish';
  aiScore: number;
  timestamp: number;
}

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  currency: Currency;
  country: string;
  event: string;
  impact: 'Low' | 'Medium' | 'High' | 'Extreme';
  forecast: string;
  previous: string;
  actual: string;
  deviation: string;
  relatedPairs: string[];
  historicalImpact: string;
  avgVolatility: string;
  typicalReaction: string;
  historicalWinRate: number;
  aiInterpretation: string;
}

export interface NewsItem {
  id: string;
  timestamp: number;
  headline: string;
  summary: string;
  source: string;
  category: string;
  importance: 'Low' | 'Medium' | 'High' | 'Critical';
  affectedCurrencies: Currency[];
  bullishCurrencies: Currency[];
  bearishCurrencies: Currency[];
  potentialImpact: string;
  timeHorizon: string;
  confidenceScore: number;
  sentiment: 'Very Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Very Bearish';
}

export interface Prediction {
  pair: string;
  direction: 'Bullish' | 'Bearish' | 'Neutral';
  bullishProbability: number;
  bearishProbability: number;
  neutralProbability: number;
  confidence: number;
  expectedVolatility: 'Low' | 'Medium' | 'High';
  support: number;
  resistance: number;
  target: number;
  invalidation: number;
  riskReward: number;
  timeHorizon: string;
  reasons: string[];
  riskFactors: string[];
  verdict: 'BUY' | 'SELL' | 'WAIT';
  timestamp: number;
  modelVersion: string;
  marketRegime: string;
}

export interface TechnicalIndicators {
  ema9: number;
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;
  sma20: number;
  sma50: number;
  sma200: number;
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  stochastic: { k: number; d: number };
  adx: number;
  atr: number;
  cci: number;
  williamsR: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  ichimoku: { tenkan: number; kijun: number; senkouA: number; senkouB: number };
  parabolicSar: number;
  pivotPoints: { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number };
}

export interface TimeframeAnalysis {
  timeframe: string;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  momentum: 'Strong' | 'Moderate' | 'Weak';
  volatility: 'Low' | 'Medium' | 'High';
  rsi: number;
  macd: 'Bullish' | 'Bearish' | 'Neutral';
  support: number;
  resistance: number;
  signal: 'Buy' | 'Sell' | 'Hold';
  confidence: number;
}

export interface CurrencyStrength {
  currency: Currency;
  strength: number;
  momentum: number;
  rsiAvg: number;
  change1h: number;
  change4h: number;
  change1d: number;
  rank: number;
}

export interface CorrelationData {
  pair1: string;
  pair2: string;
  correlation1h: number;
  correlation4h: number;
  correlationDaily: number;
  correlationWeekly: number;
}

export interface Signal {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
  marketStructureScore: number;
  volatilityScore: number;
  newsScore: number;
  totalScore: number;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  timestamp: number;
  reasoning: string;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  netProfit: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  sharpeRatio: number;
  recoveryFactor: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  id: number;
  entryDate: string;
  exitDate: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  exit: number;
  lotSize: number;
  strategy: string;
  reason: string;
  result: number;
  emotion: string;
  mistake: string;
  lesson: string;
  tags: string[];
}

export interface Alert {
  id: string;
  type: string;
  pair: string;
  condition: string;
  value: number;
  active: boolean;
  triggered: boolean;
  createdAt: number;
  triggeredAt?: number;
}

export interface MarketSession {
  name: string;
  status: 'Open' | 'Closed' | 'Pre-Market';
  open: string;
  close: string;
  timezone: string;
}

export interface ScannerResult {
  pair: string;
  condition: string;
  direction: 'Bullish' | 'Bearish';
  score: number;
  details: string;
  timestamp: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RiskCalculation {
  positionSize: number;
  lotSize: number;
  riskAmount: number;
  potentialProfit: number;
  riskReward: number;
  marginEstimate: number;
}
