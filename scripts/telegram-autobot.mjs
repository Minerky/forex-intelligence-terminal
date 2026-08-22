// Real-Time Signal Detector & Auto Telegram Dispatcher
// Menggunakan native fetch bawaan Node.js & native fs (Zero extra dependencies)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca .env.local secara manual
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...val] = trimmed.split('=');
        if (key && val.length > 0) {
          process.env[key.trim()] = val.join('=').trim();
        }
      }
    });
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHANNEL_ID;
const SCAN_INTERVAL_MS = 15000; // Scan setiap 15 detik
const COOLDOWN_MINUTES = 30; // Cooldown 30 menit per pair

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('❌ TELEGRAM_BOT_TOKEN atau TELEGRAM_CHANNEL_ID belum diisi di .env.local');
  process.exit(1);
}

// HTTP Server Mini untuk Koyeb / Render Health Check (Port 8080)
import http from 'http';

const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'running', message: 'Telegram Signal Autobot 24/7 is Live!' }));
});

server.listen(PORT, () => {
  console.log(`🌐 Health check server listening on port ${PORT}`);
});

function roundTo(v, dec) {
  const f = 10 ** dec;
  return Math.round(v * f) / f;
}

function fmt(num, pair) {
  return num.toFixed(pair.includes('JPY') || pair.includes('XAU') ? 2 : 4);
}

// Fetch live quotes dari TradingView Scanner API
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
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

// Evaluasi Kriteria Entry Real-Time
function evaluateRealtimeEntry(row) {
  const [ticker, close, change, changeAbs, high, low, open, rsi, macdVal, macdSig, atr] = row.d;
  
  let pair = ticker.replace('FX_IDC:', '').replace('FX:', '');
  if (pair === 'XAUUSD') pair = 'XAU/USD';
  else pair = pair.slice(0, 3) + '/' + pair.slice(3);

  const isGold = pair.includes('XAU');
  const d = pair.includes('JPY') || isGold ? 2 : 4;
  const currentRsi = rsi || 50;
  const currentAtr = atr || (isGold ? 12.0 : pair.includes('JPY') ? 0.6 : 0.005);

  let direction = null;
  let confidence = 0;
  let reasons = [];

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

async function sendTelegramAlert(signal) {
  const isBuy = signal.direction === 'BUY';
  const message =
    `🚨 <b>[GANDASULI SINYAL] ENTRY BARU TERDETEKSI!</b>\n\n` +
    `🪙 <b>Instrumen:</b> <code>${signal.pair}</code>\n` +
    `🎯 <b>Aksi Eksekusi:</b> <b>${isBuy ? '🟢 BUY / BELI' : '🔴 SELL / JUAL'}</b>\n` +
    `📍 <b>Harga Entry:</b> <code>${fmt(signal.entry, signal.pair)}</code>\n` +
    `🎯 <b>Target Profit (TP):</b> <code>${fmt(signal.takeProfit, signal.pair)}</code>\n` +
    `🛡️ <b>Cut Loss (SL):</b> <code>${fmt(signal.stopLoss, signal.pair)}</code>\n` +
    `⭐ <b>Akurasi/Confidence:</b> <b>${signal.confidence}%</b> (R:R 1:2.2)\n` +
    `📊 <b>RSI:</b> <code>${signal.rsi}</code>\n\n` +
    `💡 <b>Analisis:</b> <i>${signal.reason}</i>\n\n` +
    `⚡ <i>Langsung pasang Order sekarang di MT4/MT5. Gunakan lot 0.01 per $100 modal!</i>`;

  console.log(`[${new Date().toLocaleTimeString()}] 🚀 Sinyal Entry terdeteksi: ${signal.pair} [${signal.direction}]. Mengirim ke Telegram...`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`✓ Sinyal ${signal.pair} berhasil dikirim ke Telegram!`);
      sentSignals.set(signal.pair, Date.now());
    } else {
      console.error('❌ Gagal Telegram:', data.description);
    }
  } catch (err) {
    console.error('❌ Error kirim Telegram:', err.message);
  }
}

async function scanMarket() {
  const rows = await fetchTradingViewQuotes();
  if (!rows || rows.length === 0) return;

  for (const row of rows) {
    const signal = evaluateRealtimeEntry(row);
    if (signal) {
      const lastSent = sentSignals.get(signal.pair);
      const isCooldown = lastSent && Date.now() - lastSent < COOLDOWN_MINUTES * 60 * 1000;

      if (!isCooldown) {
        await sendTelegramAlert(signal);
      }
    }
  }
}

console.log('===========================================================');
console.log('🤖 LIVE REAL-TIME ENTRY SIGNAL DETECTOR AKTIF');
console.log('📡 Memantau harga Emas (XAU/USD) & Forex setiap 15 detik...');
console.log('⚡ Begitu ada konfirmasi momentum Entry (BUY/SELL), langsung kirim!');
console.log('===========================================================');

scanMarket();
setInterval(scanMarket, SCAN_INTERVAL_MS);
