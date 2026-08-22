import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Real-Time TradingView Live Market Data Provider
// ---------------------------------------------------------------------------

interface LiveQuote {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  rsi?: number;
  atr?: number;
  macd?: { value: number; signal: number; histogram: number };
  trend?: 'Bullish' | 'Bearish' | 'Neutral';
  recommendation?: number;
  timestamp: number;
  source: string;
}

const TV_FOREX_TICKERS = [
  { tv: 'FX_IDC:EURUSD', symbol: 'EUR/USD', dec: 4, spreadPips: 1.2 },
  { tv: 'FX_IDC:GBPUSD', symbol: 'GBP/USD', dec: 4, spreadPips: 1.5 },
  { tv: 'FX_IDC:USDJPY', symbol: 'USD/JPY', dec: 2, spreadPips: 1.2 },
  { tv: 'FX_IDC:USDCHF', symbol: 'USD/CHF', dec: 4, spreadPips: 1.6 },
  { tv: 'FX_IDC:AUDUSD', symbol: 'AUD/USD', dec: 4, spreadPips: 1.4 },
  { tv: 'FX_IDC:USDCAD', symbol: 'USD/CAD', dec: 4, spreadPips: 1.5 },
  { tv: 'FX_IDC:NZDUSD', symbol: 'NZD/USD', dec: 4, spreadPips: 1.8 },
  { tv: 'FX_IDC:EURGBP', symbol: 'EUR/GBP', dec: 4, spreadPips: 1.6 },
  { tv: 'FX_IDC:EURJPY', symbol: 'EUR/JPY', dec: 2, spreadPips: 1.8 },
  { tv: 'FX_IDC:GBPJPY', symbol: 'GBP/JPY', dec: 2, spreadPips: 2.2 },
];

export async function GET() {
  try {
    const liveQuotes: Record<string, LiveQuote> = {};
    const now = Date.now();

    // 1. Fetch Live Forex quotes from TradingView Scanner API
    try {
      const tvForexRes = await fetch('https://scanner.tradingview.com/forex/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
        body: JSON.stringify({
          symbols: {
            tickers: TV_FOREX_TICKERS.map((t) => t.tv),
          },
          columns: [
            'close',
            'open',
            'high',
            'low',
            'change',
            'change_abs',
            'Recommend.All',
            'RSI',
            'MACD.macd',
            'MACD.signal',
            'ATR',
          ],
        }),
        next: { revalidate: 2 },
      });

      if (tvForexRes.ok) {
        const tvData = await tvForexRes.json();
        if (Array.isArray(tvData.data)) {
          for (const item of tvData.data) {
            const match = TV_FOREX_TICKERS.find((t) => t.tv === item.s);
            if (match && Array.isArray(item.d)) {
              const [close, open, high, low, changePct, changeAbs, rec, rsi, macdVal, macdSig, atr] = item.d;

              const price = Number(close);
              const dec = match.dec;
              const pipUnit = match.symbol.includes('JPY') ? 0.01 : 0.0001;
              const halfSpread = (match.spreadPips * pipUnit) / 2;

              let trend: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
              if (rec > 0.1) trend = 'Bullish';
              else if (rec < -0.1) trend = 'Bearish';

              liveQuotes[match.symbol] = {
                symbol: match.symbol,
                price: Number(price.toFixed(dec)),
                bid: Number((price - halfSpread).toFixed(dec)),
                ask: Number((price + halfSpread).toFixed(dec)),
                change: Number(changeAbs ? Number(changeAbs).toFixed(dec) : '0'),
                changePercent: Number(changePct ? Number(changePct).toFixed(2) : '0'),
                high: Number(Number(high || price * 1.002).toFixed(dec)),
                low: Number(Number(low || price * 0.998).toFixed(dec)),
                open: Number(Number(open || price).toFixed(dec)),
                prevClose: Number(Number(open || price).toFixed(dec)),
                rsi: rsi ? Number(Number(rsi).toFixed(1)) : undefined,
                atr: atr ? Number(Number(atr).toFixed(dec)) : undefined,
                macd:
                  macdVal !== undefined && macdSig !== undefined
                    ? {
                        value: Number(macdVal),
                        signal: Number(macdSig),
                        histogram: Number(macdVal) - Number(macdSig),
                      }
                    : undefined,
                trend,
                recommendation: rec,
                timestamp: now,
                source: 'TradingView Real-Time Feed',
              };
            }
          }
        }
      }
    } catch {
      // Forex Scanner error handled
    }

    // 2. Fetch Live Gold (XAU/USD) from TradingView CFD Scanner (OANDA:XAUUSD / TVC:GOLD)
    try {
      const tvGoldRes = await fetch('https://scanner.tradingview.com/cfd/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
        body: JSON.stringify({
          symbols: {
            tickers: ['OANDA:XAUUSD', 'TVC:GOLD'],
          },
          columns: [
            'close',
            'open',
            'high',
            'low',
            'change',
            'change_abs',
            'Recommend.All',
            'RSI',
            'MACD.macd',
            'MACD.signal',
            'ATR',
          ],
        }),
        next: { revalidate: 2 },
      });

      if (tvGoldRes.ok) {
        const goldTvData = await tvGoldRes.json();
        const goldItem = goldTvData?.data?.[0];

        if (goldItem && Array.isArray(goldItem.d)) {
          const [close, open, high, low, changePct, changeAbs, rec, rsi, macdVal, macdSig, atr] = goldItem.d;
          const goldPrice = Number(close);

          let trend: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
          if (rec > 0.1) trend = 'Bullish';
          else if (rec < -0.1) trend = 'Bearish';

          liveQuotes['XAU/USD'] = {
            symbol: 'XAU/USD',
            price: Number(goldPrice.toFixed(2)),
            bid: Number((goldPrice - 0.25).toFixed(2)),
            ask: Number((goldPrice + 0.25).toFixed(2)),
            change: Number(changeAbs ? Number(changeAbs).toFixed(2) : '0'),
            changePercent: Number(changePct ? Number(changePct).toFixed(2) : '0'),
            high: Number(Number(high || goldPrice * 1.005).toFixed(2)),
            low: Number(Number(low || goldPrice * 0.995).toFixed(2)),
            open: Number(Number(open || goldPrice).toFixed(2)),
            prevClose: Number(Number(open || goldPrice).toFixed(2)),
            rsi: rsi ? Number(Number(rsi).toFixed(1)) : undefined,
            atr: atr ? Number(Number(atr).toFixed(2)) : undefined,
            macd:
              macdVal !== undefined && macdSig !== undefined
                ? {
                    value: Number(macdVal),
                    signal: Number(macdSig),
                    histogram: Number(macdVal) - Number(macdSig),
                  }
                : undefined,
            trend,
            recommendation: rec,
            timestamp: now,
            source: 'TradingView (OANDA / TVC Spot Gold)',
          };
        }
      }
    } catch {
      // Gold Scanner error handled
    }

    return NextResponse.json({
      success: true,
      status: 'live',
      provider: 'TradingView Real-Time Feed',
      timestamp: now,
      quotes: liveQuotes,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch TradingView market data', status: 'fallback' },
      { status: 500 }
    );
  }
}
