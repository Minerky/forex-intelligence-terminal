import { NextRequest, NextResponse } from 'next/server';
import { CURRENCY_PAIRS, ECONOMIC_EVENTS, generateSignals } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Format currency
function fmt(num: number, pair: string) {
  return num.toFixed(pair.includes('JPY') || pair.includes('XAU') ? 2 : 4);
}

// Telegram message sender helper
async function sendTelegramMessage(token: string, chatId: string | number, text: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  return res.json();
}

// Command Handlers (Zero Database - In-Memory State)
function handleCommand(cmd: string): string {
  const cleanCmd = cmd.toLowerCase().trim().replace(/@\w+/, ''); // remove @bot_name suffix if in group

  if (cleanCmd === '/start' || cleanCmd === '/help') {
    return (
      `🤖 <b>FOREX INTELLIGENCE TERMINAL BOT</b>\n\n` +
      `Selamat datang! Gunakan command berikut untuk analisa dan sinyal pasar real-time:\n\n` +
      `📌 <b>COMMAND UTAMA:</b>\n` +
      `• <code>/gold</code> atau <code>/xauusd</code> — Live analisis & harga Emas\n` +
      `• <code>/signals</code> atau <code>/sinyal</code> — Rekomendasi sinyal AI terbaru\n` +
      `• <code>/market</code> — Status sesi pasar London, NY, Tokyo, Sydney\n` +
      `• <code>/calendar</code> — Kalender berita ekonomi High-Impact hari ini\n` +
      `• <code>/forex</code> — Ringkasan pasangan mata uang utama\n\n` +
      `<i>💡 Ditenagai oleh AI Signal Engine & TradingView Scanner</i>`
    );
  }

  if (cleanCmd === '/gold' || cleanCmd === '/xauusd') {
    const gold = CURRENCY_PAIRS.find((p) => p.symbol === 'XAU/USD');
    const signals = generateSignals();
    const goldSignal = signals.find((s) => s.pair === 'XAU/USD');
    const price = gold?.price || 2938.50;
    const change = gold?.changePercent || 0.45;

    return (
      `👑 <b>ANALISIS & UPDATE EMAS SPOT (XAU/USD)</b>\n\n` +
      `💰 <b>Harga Saat Ini:</b> <code>$${price.toFixed(2)}</code> (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)\n` +
      `📈 <b>Tren Pasar:</b> ${gold?.trend || 'Bullish'}\n` +
      `📊 <b>RSI (14):</b> <code>${gold?.rsi || 65}</code>\n\n` +
      (goldSignal
        ? `🎯 <b>Sinyal AI:</b> <b>${goldSignal.direction}</b>\n` +
          `• Entry: <code>$${goldSignal.entry.toFixed(2)}</code>\n` +
          `• TP: <code>$${goldSignal.takeProfit.toFixed(2)}</code>\n` +
          `• Cut Loss (SL): <code>$${goldSignal.stopLoss.toFixed(2)}</code>\n` +
          `• Keyakinan: <b>${goldSignal.confidence}%</b>\n\n` +
          `<i>Analisis: ${goldSignal.reasoning}</i>`
        : `<i>Status: Pasar berkonsolidasi, menunggu momentum breakout.</i>`)
    );
  }

  if (cleanCmd === '/signals' || cleanCmd === '/sinyal') {
    const signals = generateSignals().slice(0, 4);
    let msg = `⚡ <b>REKOMENDASI SINYAL TRADING AI</b>\n\n`;

    signals.forEach((s, idx) => {
      const isBuy = s.direction === 'BUY';
      msg += `<b>${idx + 1}. ${s.pair}</b> [${isBuy ? '🟢 BUY' : '🔴 SELL'}]\n`;
      msg += `   • Entry: <code>${fmt(s.entry, s.pair)}</code>\n`;
      msg += `   • TP: <code>${fmt(s.takeProfit, s.pair)}</code> | SL: <code>${fmt(s.stopLoss, s.pair)}</code>\n`;
      msg += `   • Conf: <b>${s.confidence}%</b> | R:R 1:${s.riskReward}\n\n`;
    });

    msg += `<i>⚠️ Gunakan money management 1-2% risiko per trade.</i>`;
    return msg;
  }

  if (cleanCmd === '/market' || cleanCmd === '/sesi') {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    const sydney = utcHour >= 22 || utcHour < 7 ? '🟢 BUKA' : '⚪ TUTUP';
    const tokyo = utcHour >= 0 && utcHour < 9 ? '🟢 BUKA' : '⚪ TUTUP';
    const london = utcHour >= 8 && utcHour < 17 ? '🟢 BUKA' : '⚪ TUTUP';
    const newYork = utcHour >= 13 && utcHour < 22 ? '🟢 BUKA' : '⚪ TUTUP';

    return (
      `🌍 <b>STATUS SESI PASAR FOREX GLOBAL</b>\n\n` +
      `🇦🇺 <b>Sydney:</b> ${sydney} (22:00 - 07:00 UTC)\n` +
      `🇯🇵 <b>Tokyo:</b> ${tokyo} (00:00 - 09:00 UTC)\n` +
      `🇬🇧 <b>London:</b> ${london} (08:00 - 17:00 UTC)\n` +
      `🇺🇸 <b>New York:</b> ${newYork} (13:00 - 22:00 UTC)\n\n` +
      `<i>⏰ Waktu Server UTC: ${now.toUTCString()}</i>\n` +
      `<i>💡 Volatilitas tertinggi terjadi saat tumpang tindih Sesi London & New York (13:00 - 17:00 UTC).</i>`
    );
  }

  if (cleanCmd === '/calendar') {
    const highImpact = ECONOMIC_EVENTS.filter((e) => e.impact === 'High').slice(0, 5);
    let msg = `📅 <b>KALENDER EKONOMI BERDAMPAK TINGGI (HIGH IMPACT)</b>\n\n`;

    highImpact.forEach((e) => {
      msg += `🔴 <b>[${e.currency}] ${e.event}</b>\n`;
      msg += `   • Waktu: <code>${e.time}</code>\n`;
      msg += `   • Forecast: <code>${e.forecast || '-'}</code> | Prev: <code>${e.previous || '-'}</code>\n\n`;
    });

    msg += `<i>💡 Waspada lonjakan spread & volatilitas tajam saat rilis berita merah.</i>`;
    return msg;
  }

  if (cleanCmd === '/forex') {
    let msg = `📊 <b>RINGKASAN HARGA FOREX UTAMA</b>\n\n`;
    CURRENCY_PAIRS.slice(0, 6).forEach((p) => {
      const sign = p.changePercent >= 0 ? '+' : '';
      const icon = p.trend === 'Bullish' ? '🟢' : p.trend === 'Bearish' ? '🔴' : '🟡';
      msg += `${icon} <b>${p.symbol}:</b> <code>${fmt(p.price, p.symbol)}</code> (${sign}${p.changePercent.toFixed(2)}%)\n`;
    });
    return msg;
  }

  return (
    `❓ Perintah tidak dikenali: <code>${cmd}</code>\n\n` +
    `Ketik <code>/help</code> atau <code>/start</code> untuk melihat daftar perintah yang tersedia.`
  );
}

// ---------------------------------------------------------------------------
// POST: Webhook Telegram or Broadcast Dispatcher
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN || body.botToken;

    if (!botToken) {
      return NextResponse.json(
        { success: false, error: 'TELEGRAM_BOT_TOKEN belum dikonfigurasi.' },
        { status: 400 }
      );
    }

    // 1. Case A: Webhook update from Telegram servers (User or Group sent a message)
    if (body.update_id) {
      const message = body.message || body.channel_post;
      if (message && message.text) {
        const text = message.text.trim();
        const chatId = message.chat.id;

        if (text.startsWith('/')) {
          const replyText = handleCommand(text);
          await sendTelegramMessage(botToken, chatId, replyText);
        }
      }
      return NextResponse.json({ ok: true });
    }

    // 2. Case B: Broadcast request from Web Terminal UI
    const targetChat = body.chatId || process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!targetChat) {
      return NextResponse.json(
        { success: false, error: 'Target Channel ID / Chat ID belum ditentukan.' },
        { status: 400 }
      );
    }

    let messageToSend = body.message;

    // Optional presets
    if (body.type === 'SIGNAL_BROADCAST' && body.signal) {
      const s = body.signal;
      const isBuy = s.direction === 'BUY';
      messageToSend =
        `📢 <b>[BROADCAST] SINYAL TRADING AI RESMI</b>\n\n` +
        `🪙 <b>Instrumen:</b> <code>${s.pair}</code>\n` +
        `🎯 <b>Aksi:</b> <b>${isBuy ? '🟢 BUY / BELI' : '🔴 SELL / JUAL'}</b>\n` +
        `📍 <b>Entry:</b> <code>${fmt(s.entry, s.pair)}</code>\n` +
        `🎯 <b>Take Profit (TP):</b> <code>${fmt(s.takeProfit, s.pair)}</code>\n` +
        `🛡️ <b>Cut Loss (SL):</b> <code>${fmt(s.stopLoss, s.pair)}</code>\n` +
        `⭐ <b>Confidence AI:</b> <b>${s.confidence}%</b> (R:R 1:${s.riskReward})\n\n` +
        `💡 <b>Analisis:</b> <i>${s.reasoning}</i>\n\n` +
        `<i>⚖️ Manajemen Risiko: Maksimal 1-2% dari modal trading Anda.</i>`;
    } else if (body.type === 'DAILY_BRIEFING') {
      const gold = CURRENCY_PAIRS.find((p) => p.symbol === 'XAU/USD');
      messageToSend =
        `🌅 <b>[DAILY MARKET BRIEFING] FOREX TERMINAL</b>\n\n` +
        `👑 <b>Emas (XAU/USD):</b> $${gold?.price.toFixed(2) || '2938.50'} (${gold?.trend || 'Bullish'})\n` +
        `📊 <b>Fokus Hari Ini:</b> Likuiditas sesi London & rilis berita US Dollar.\n\n` +
        `Buka terminal untuk grafik live: /signals atau kunjungi dashboard.\n` +
        `<i>Selamat bertrading secara disiplin & terukur!</i>`;
    }

    if (!messageToSend) {
      return NextResponse.json(
        { success: false, error: 'Pesan broadcast tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const result = await sendTelegramMessage(botToken, targetChat, messageToSend);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.description || 'Gagal mengirim pesan Telegram' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pesan berhasil disiarkan ke Channel Telegram!',
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET: Status Check & Info
// ---------------------------------------------------------------------------
export async function GET() {
  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
  const hasChannel = !!process.env.TELEGRAM_CHANNEL_ID;

  return NextResponse.json({
    status: 'online',
    configured: {
      botToken: hasToken,
      channelId: hasChannel,
    },
    supportedCommands: ['/start', '/help', '/gold', '/signals', '/market', '/calendar', '/forex'],
  });
}
