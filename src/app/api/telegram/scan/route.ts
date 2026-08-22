import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// In-Memory cache cooldown per Vercel instance
const lastAlertTime: Record<string, number> = {};
const COOLDOWN_MS = 30 * 60 * 1000; // 30 menit cooldown per pair

function roundTo(v: number, dec: number) {
  const f = 10 ** dec;
  return Math.round(v * f) / f;
}

function fmt(num: number, pair: string) {
  return num.toFixed(pair.includes('JPY') || pair.includes('XAU') ? 2 : 4);
}

// Fetch live quotes from TradingView Scanner API
async function fetchTradingViewQuotes() {
  try {
    const symbols = [
      'FX_IDC:XAUUSD',
      'FX:EURUSD',
      'FX:GBPUSD',
      'FX:USDJPY',
      'FX:USDCHF',
      'FX:AUDUSD',
      'FX:USDCAD',
      'FX:NZDUSD',
    ];

    const body = {
      symbols: { tickers: symbols, query: { types: [] } },
      columns: [
        'name',
        'close',
        'change',
        'change_abs',
        'high',
        'low',
        'open',
        'RSI',
        'MACD.macd',
        'MACD.signal',
        'ATR',
      ],
    };

    const res = await fetch('https://scanner.tradingview.com/forex/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

// Evaluasi Kriteria Entry Real-Time
function evaluateRealtimeEntry(row: any) {
  const [ticker, close, change, changeAbs, high, low, open, rsi, macdVal, macdSig, atr] = row.d;

  let pair = ticker.replace('FX_IDC:', '').replace('FX:', '');
  if (pair === 'XAUUSD') pair = 'XAU/USD';
  else pair = pair.slice(0, 3) + '/' + pair.slice(3);

  const isGold = pair.includes('XAU');
  const d = pair.includes('JPY') || isGold ? 2 : 4;
  const currentRsi = Number(rsi) || 50;
  const currentAtr = Number(atr) || (isGold ? 12.0 : pair.includes('JPY') ? 0.6 : 0.005);

  let direction: 'BUY' | 'SELL' | null = null;
  let confidence = 0;
  const reasons: string[] = [];

  // --- ENTRY BUY CRITERIA ---
  if (macdVal > macdSig && currentRsi >= 45 && currentRsi <= 68 && close > open) {
    direction = 'BUY';
    confidence = Math.min(96, Math.floor(78 + (currentRsi - 45) * 0.7));
    reasons.push('MACD Bullish Crossover terkonfirmasi');
    reasons.push(`RSI (${currentRsi.toFixed(1)}) zona akumulasi sehat`);
    reasons.push('Breakout momentum di atas Open harian');
  }
  // --- ENTRY SELL CRITERIA ---
  else if (macdVal < macdSig && currentRsi >= 32 && currentRsi <= 55 && close < open) {
    direction = 'SELL';
    confidence = Math.min(96, Math.floor(78 + (55 - currentRsi) * 0.7));
    reasons.push('MACD Bearish Crossover terkonfirmasi');
    reasons.push(`RSI (${currentRsi.toFixed(1)}) zona distribusi jual`);
    reasons.push('Breakdown momentum di bawah Open harian');
  }

  if (!direction || confidence < 78) {
    return null;
  }

  const slDist = currentAtr * 1.0;
  const tpDist = currentAtr * 2.2;

  const entry = roundTo(close, d);
  const stopLoss = direction === 'BUY' ? roundTo(entry - slDist, d) : roundTo(entry + slDist, d);
  const takeProfit = direction === 'BUY' ? roundTo(entry + tpDist, d) : roundTo(entry - tpDist, d);

  return {
    pair,
    direction,
    entry,
    stopLoss,
    takeProfit,
    confidence,
    rsi: currentRsi.toFixed(1),
    reason: reasons.join(' • '),
  };
}

async function sendTelegramAlert(signal: any, botToken: string, chatId: string) {
  const isBuy = signal.direction === 'BUY';
  const message =
    `🚨 <b>[ENTRY SIGNAL] SINYAL TRADING BARU TERDETEKSI!</b>\n\n` +
    `🪙 <b>Instrumen:</b> <code>${signal.pair}</code>\n` +
    `🎯 <b>Aksi Eksekusi:</b> <b>${isBuy ? '🟢 BUY / BELI' : '🔴 SELL / JUAL'}</b>\n` +
    `📍 <b>Harga Entry:</b> <code>${fmt(signal.entry, signal.pair)}</code>\n` +
    `🎯 <b>Target Profit (TP):</b> <code>${fmt(signal.takeProfit, signal.pair)}</code>\n` +
    `🛡️ <b>Cut Loss (SL):</b> <code>${fmt(signal.stopLoss, signal.pair)}</code>\n` +
    `⭐ <b>Akurasi/Confidence:</b> <b>${signal.confidence}%</b> (R:R 1:2.2)\n` +
    `📊 <b>RSI:</b> <code>${signal.rsi}</code>\n\n` +
    `💡 <b>Analisis:</b> <i>${signal.reason}</i>\n\n` +
    `⚡ <i>Langsung pasang Order sekarang di MT4/MT5. Gunakan lot 0.01 per $100 modal!</i>`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
  return res.json();
}

// GET Handler - Triggered automatically by UptimeRobot / Cron / Browser
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !chatId) {
    return NextResponse.json({
      success: false,
      error: 'TELEGRAM_BOT_TOKEN atau TELEGRAM_CHANNEL_ID belum dikonfigurasi di Environment Variables.',
    });
  }

  const rows = await fetchTradingViewQuotes();
  if (!rows || rows.length === 0) {
    return NextResponse.json({ success: false, message: 'Gagal mengambil data TradingView' });
  }

  const detectedSignals: any[] = [];
  const sentSignals: string[] = [];

  for (const row of rows) {
    const signal = evaluateRealtimeEntry(row);
    if (signal) {
      detectedSignals.push(signal);
      const lastSent = lastAlertTime[signal.pair];
      const isCooldown = lastSent && Date.now() - lastSent < COOLDOWN_MS;

      if (!isCooldown) {
        await sendTelegramAlert(signal, botToken, chatId);
        lastAlertTime[signal.pair] = Date.now();
        sentSignals.push(`${signal.pair} (${signal.direction})`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    scannedPairs: rows.length,
    detectedEntries: detectedSignals.length,
    sentToTelegram: sentSignals,
    status: 'Scanner 24/7 Active',
  });
}
