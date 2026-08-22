import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// In-memory cache for MT4/MT5 Live Bridge Data
// ---------------------------------------------------------------------------

interface MTPriceTick {
  symbol: string;
  bid: number;
  ask: number;
  price: number;
  spread: number;
  high?: number;
  low?: number;
  time: number;
}

interface MTBridgeState {
  connected: boolean;
  broker: string;
  accountNumber: string;
  serverTime: string;
  lastReceived: number;
  quotes: Record<string, MTPriceTick>;
}

// Global variable across hot reloads in Node.js environment
const globalBridge = global as unknown as {
  __mtBridgeState?: MTBridgeState;
};

if (!globalBridge.__mtBridgeState) {
  globalBridge.__mtBridgeState = {
    connected: false,
    broker: 'Not Connected',
    accountNumber: '',
    serverTime: '',
    lastReceived: 0,
    quotes: {},
  };
}

// GET: Returns the latest live prices streamed from MT4/MT5
export async function GET() {
  const state = globalBridge.__mtBridgeState!;
  const isAlive = Date.now() - state.lastReceived < 15000; // active within last 15s

  return NextResponse.json({
    success: true,
    connected: state.connected && isAlive,
    broker: state.broker,
    accountNumber: state.accountNumber,
    serverTime: state.serverTime,
    lastReceived: state.lastReceived,
    quotes: state.quotes,
  });
}

// POST: Receives real-time ticks from MT4/MT5 Expert Advisor (EA)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { broker, account, serverTime, quotes } = body;

    if (!quotes || typeof quotes !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid quotes format' },
        { status: 400 }
      );
    }

    const state = globalBridge.__mtBridgeState!;
    state.connected = true;
    state.broker = broker || 'MetaTrader 4/5 Broker';
    state.accountNumber = account ? String(account) : '';
    state.serverTime = serverTime || new Date().toISOString();
    state.lastReceived = Date.now();

    // Standardize symbol names (e.g. XAUUSD -> XAU/USD, EURUSD.m -> EUR/USD)
    for (const [rawSymbol, data] of Object.entries(quotes)) {
      const q = data as { bid: number; ask: number; price?: number; spread?: number; high?: number; low?: number };
      const clean = rawSymbol.toUpperCase().replace(/[^A-Z]/g, '');

      let normalized = rawSymbol;
      if (clean.startsWith('XAUUSD') || clean.startsWith('GOLD')) normalized = 'XAU/USD';
      else if (clean.startsWith('EURUSD')) normalized = 'EUR/USD';
      else if (clean.startsWith('GBPUSD')) normalized = 'GBP/USD';
      else if (clean.startsWith('USDJPY')) normalized = 'USD/JPY';
      else if (clean.startsWith('USDCHF')) normalized = 'USD/CHF';
      else if (clean.startsWith('AUDUSD')) normalized = 'AUD/USD';
      else if (clean.startsWith('USDCAD')) normalized = 'USD/CAD';
      else if (clean.startsWith('NZDUSD')) normalized = 'NZD/USD';
      else if (clean.startsWith('EURGBP')) normalized = 'EUR/GBP';
      else if (clean.startsWith('EURJPY')) normalized = 'EUR/JPY';
      else if (clean.startsWith('GBPJPY')) normalized = 'GBP/JPY';

      const price = q.price || (q.bid + q.ask) / 2;
      const isJPY = normalized.includes('JPY');
      const isGold = normalized.includes('XAU');
      const dec = isJPY || isGold ? 2 : 4;
      const spread = q.spread !== undefined ? q.spread : Math.abs(q.ask - q.bid) / (isGold ? 0.1 : isJPY ? 0.01 : 0.0001);

      state.quotes[normalized] = {
        symbol: normalized,
        bid: Number(q.bid.toFixed(dec)),
        ask: Number(q.ask.toFixed(dec)),
        price: Number(price.toFixed(dec)),
        spread: Number(spread.toFixed(1)),
        high: q.high ? Number(q.high.toFixed(dec)) : undefined,
        low: q.low ? Number(q.low.toFixed(dec)) : undefined,
        time: Date.now(),
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Ticks updated successfully from MetaTrader',
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
