'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForexStore, isMarketOpenNow } from '@/lib/store';
import {
  Shield,
  Send,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  DollarSign,
  HeartHandshake,
  Bot,
  Sparkles,
  Zap,
  Target,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export default function ActionPlanPage() {
  const pairs = useForexStore((s) => s.pairs);
  const signals = useForexStore((s) => s.signals);
  const refreshSignals = useForexStore((s) => s.refreshSignals);
  const updatePrices = useForexStore((s) => s.updatePrices);

  // Capital visualizer
  const [capital, setCapital] = useState<number>(50); // $50 default uang dingin
  const [accountType, setAccountType] = useState<'standard' | 'cent'>('standard');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Telegram states
  const [telegramToken, setTelegramToken] = useState<string>('');
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [telegramSending, setTelegramSending] = useState<boolean>(false);
  const [telegramStatus, setTelegramStatus] = useState<{ msg: string; success: boolean } | null>(null);

  // Load Telegram config from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('fit_tg_token');
      const savedChatId = localStorage.getItem('fit_tg_chat_id');
      if (savedToken) setTelegramToken(savedToken);
      if (savedChatId) setTelegramChatId(savedChatId);
    } catch {}
  }, []);

  useEffect(() => {
    refreshSignals();
    const id = setInterval(updatePrices, 2000);
    return () => clearInterval(id);
  }, [refreshSignals, updatePrices]);

  const marketOpen = isMarketOpenNow();

  // Pick top 2 high-confidence actionable setups
  const topSetups = useMemo(() => {
    const actionable = signals.filter((s) => s.direction === 'BUY' || s.direction === 'SELL');
    if (actionable.length > 0) {
      return actionable.sort((a, b) => b.confidence - a.confidence).slice(0, 2);
    }
    return signals.slice(0, 2);
  }, [signals]);

  // Copy signal handler
  function handleCopy(s: typeof signals[0]) {
    const text = `🎯 [RENCANA HARIAN AI - ${s.pair}]\n• Arah: ${s.direction} @ ${s.entry}\n• Take Profit (TP): ${s.takeProfit}\n• Cut Loss (SL): ${s.stopLoss}\n• Rekomendasi Lot: 0.01 Lot\n• Keyakinan AI: ${s.confidence}%\n• Analisis: ${s.reasoning}`;
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Send to Telegram handler
  async function handleSendTelegram(s: typeof signals[0]) {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      setTelegramStatus({
        msg: '⚠️ Masukkan Bot Token & Chat ID Telegram di formulir bawah terlebih dahulu.',
        success: false,
      });
      return;
    }

    setTelegramSending(true);
    setTelegramStatus(null);

    const message = `🤖 <b>SINYAL TRADING AI DISPATCHER</b>\n\n` +
      `<b>Instrumen:</b> <code>${s.pair}</code>\n` +
      `<b>Tindakan:</b> <b>${s.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL'}</b>\n` +
      `<b>Harga Masuk (Entry):</b> <code>${s.entry}</code>\n` +
      `<b>Target Profit (TP):</b> <code>${s.takeProfit}</code>\n` +
      `<b>Batas Risiko (Cut Loss):</b> <code>${s.stopLoss}</code>\n` +
      `<b>Rekomendasi Lot:</b> <code>0.01 Lot</code>\n` +
      `<b>Tingkat Keyakinan AI:</b> <b>${s.confidence}%</b>\n\n` +
      `<i>Analisis: ${s.reasoning}</i>\n` +
      `<i>Gunakan manajemen risiko disiplin 1% per trade.</i>`;

    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramToken,
          chatId: telegramChatId,
          message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus({ msg: '✓ Sinyal berhasil dikirim ke aplikasi Telegram HP Anda!', success: true });
        localStorage.setItem('fit_tg_token', telegramToken);
        localStorage.setItem('fit_tg_chat_id', telegramChatId);
      } else {
        setTelegramStatus({ msg: `❌ Gagal: ${data.error}`, success: false });
      }
    } catch {
      setTelegramStatus({ msg: '❌ Terjadi kesalahan jaringan saat mengirim ke Telegram', success: false });
    } finally {
      setTelegramSending(false);
    }
  }

  // Worst-Case Scenario Math
  const riskPerTrade = capital * 0.02; // 2% risk
  const threeLossesRisk = riskPerTrade * 3;
  const remainingCapital = capital - threeLossesRisk;
  const remainingPercent = ((remainingCapital / capital) * 100).toFixed(1);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <Sparkles className="h-3 w-3" />
            PANDUAN PRAKTIS ORANG AWAM
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            Rencana Aksi Harian AI (Mode Uang Dingin)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">Status Pasar:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded ${
              marketOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {marketOpen ? '🟢 PASAR DIBUKA' : '🟡 PASAR TUTUP (AKHIR PEKAN)'}
          </span>
        </div>
      </div>

      {/* Main Philosophy Card */}
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 p-5 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
          <Bot className="h-5 w-5" />
          Rencana Trading AI: Sederhana, Santai, Tanpa Pusing Indikator
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Anda tidak perlu menghafal rumus teknikal atau memelototi grafik seharian. Cukup ikuti <strong>instruksi 3 langkah</strong> di bawah ini, pasang target keuntungan (TP) dan pengaman modal (Cut Loss / SL) di MT4/MT5, lalu biarkan matematika probabilitas bekerja untuk uang dingin Anda.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* STEP-BY-STEP ACTIONABLE SETUPS FOR TODAY                          */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-200">
          <Zap className="h-4 w-4 text-yellow-400" /> Rekomendasi Sinyal Eksekusi Terbaik Hari Ini
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {topSetups.map((s, idx) => {
            const isBuy = s.direction === 'BUY';
            const isWait = s.direction === 'WAIT';

            return (
              <div
                key={s.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  {/* Setup Badge */}
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-zinc-100">{s.pair}</span>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                        Opsi #{idx + 1}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black tracking-wider ${
                        isBuy
                          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                          : isWait
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                          : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
                      }`}
                    >
                      {isBuy ? <TrendingUp className="h-3 w-3" /> : isWait ? <Shield className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {s.direction}
                    </span>
                  </div>

                  {/* 3 Step Instruction Guide */}
                  <div className="space-y-2.5 text-xs">
                    {/* Step 1 */}
                    <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800 flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[11px] font-bold text-blue-400">
                        1
                      </span>
                      <div>
                        <span className="font-semibold text-zinc-300 block">Tindakan Order di MT4/MT5:</span>
                        <p className="text-zinc-400 text-[11px]">
                          Buka order <strong>{s.direction}</strong> pada pasangan <strong>{s.pair}</strong> di harga masuk sekitar <code className="text-zinc-200 font-bold">{s.entry}</code>.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800 flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400">
                        2
                      </span>
                      <div className="w-full">
                        <span className="font-semibold text-zinc-300 block">Pasang Level TP &amp; SL Wajib:</span>
                        <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-[11px]">
                          <div className="rounded bg-emerald-950/40 p-1.5 border border-emerald-500/20">
                            <span className="text-emerald-400 block text-[9px] font-sans uppercase">Take Profit (TP)</span>
                            <strong className="text-emerald-300">{s.takeProfit}</strong>
                          </div>
                          <div className="rounded bg-red-950/40 p-1.5 border border-red-500/20">
                            <span className="text-red-400 block text-[9px] font-sans uppercase">Cut Loss (SL)</span>
                            <strong className="text-red-300">{s.stopLoss}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800 flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[11px] font-bold text-purple-400">
                        3
                      </span>
                      <div>
                        <span className="font-semibold text-zinc-300 block">Ukuran Lot Aman:</span>
                        <p className="text-zinc-400 text-[11px]">
                          Gunakan ukuran lot terkecil <strong>0.01 Lot</strong> (atau 0.10 di Akun Cent) agar risiko kerugian maksimal hanya $1–$2.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <p className="mt-3 text-[11px] text-zinc-500 italic">
                    Analisis AI: {s.reasoning}
                  </p>
                </div>

                {/* Bottom Buttons: Copy & Send Telegram */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCopy(s)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
                    >
                      {copiedId === s.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === s.id ? 'Tersalin!' : 'Salin Instruksi'}
                    </button>

                    <button
                      onClick={() => handleSendTelegram(s)}
                      disabled={telegramSending}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-500 transition disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Kirim ke Telegram HP
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* WORST-CASE SCENARIO RISK VISUALIZER                               */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
            <ShieldAlert className="h-4 w-4 text-emerald-400" /> Kalkulator Proteksi Skenario Terburuk (Worst-Case)
          </h3>
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded">
            Prinsip Uang Dingin Aman
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Berapa modal uang dingin yang Anda siapkan? Lihat bukti matematika bahwa modal Anda tetap aman meskipun mengalami kekalahan berturut-turut:
        </p>

        {/* Input Capital */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">Modal Dingin Anda:</span>
          <div className="flex items-center gap-2">
            {[20, 50, 100, 200].map((amt) => (
              <button
                key={amt}
                onClick={() => setCapital(amt)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold font-mono transition ${
                  capital === amt
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                }`}
              >
                ${amt} USD
              </button>
            ))}
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-mono text-zinc-100 outline-none focus:border-emerald-500"
              placeholder="Jumlah $"
            />
          </div>
        </div>

        {/* Visualizer Result */}
        <div className="grid gap-3 sm:grid-cols-3 pt-2 text-xs">
          <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px]">Risiko Per Trade (Disiplin 2%):</span>
            <div className="text-lg font-bold font-mono text-red-400">-${riskPerTrade.toFixed(2)} USD</div>
            <p className="text-[10px] text-zinc-500">Jika satu transaksi terkena Cut Loss (SL)</p>
          </div>

          <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px]">Skenario Kalah 3x Beruntun:</span>
            <div className="text-lg font-bold font-mono text-amber-400">-${threeLossesRisk.toFixed(2)} USD</div>
            <p className="text-[10px] text-zinc-500">Total kerugian jika 3 trade berturut-turut salah</p>
          </div>

          <div className="rounded-lg bg-zinc-950 p-3.5 border border-emerald-500/30 space-y-1">
            <span className="text-emerald-400 text-[11px] font-bold">Sisa Modal Dingin Anda:</span>
            <div className="text-lg font-bold font-mono text-emerald-300">
              ${remainingCapital.toFixed(2)} USD ({remainingPercent}%)
            </div>
            <p className="text-[10px] text-emerald-400/80">Modal Anda masih 94% utuh untuk membalas profit!</p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* TELEGRAM NOTIFICATION BOT CONFIGURATION                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
            <Send className="h-4 w-4 text-blue-400" /> Pengaturan Notifikasi Sinyal Telegram Otomatis ke HP
          </h3>
          <span className="text-[10px] text-zinc-500">Gratis &amp; Instan</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Hubungkan dengan Bot Telegram Anda agar Anda menerima pemberitahuan sinyal berbunyi di HP tanpa harus membuka laptop:
        </p>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <label className="space-y-1">
            <span className="text-zinc-400">Bot Token Telegram (Dari @BotFather):</span>
            <input
              type="text"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder="Contoh: 7123456789:AAH..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 font-mono outline-none focus:border-blue-500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-zinc-400">Chat ID Telegram Anda (Dari @userinfobot):</span>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Contoh: 123456789"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 font-mono outline-none focus:border-blue-500"
            />
          </label>
        </div>

        {telegramStatus && (
          <div
            className={`rounded-lg p-3 text-xs font-semibold ${
              telegramStatus.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-red-950/60 text-red-300 border border-red-500/30'
            }`}
          >
            {telegramStatus.msg}
          </div>
        )}

        <div className="rounded-lg bg-zinc-950 p-3 text-[11px] text-zinc-400 border border-zinc-800 flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong>Panduan 1 Menit Buat Bot Telegram:</strong> Buka aplikasi Telegram $\rightarrow$ cari <code>@BotFather</code> $\rightarrow$ kirim <code>/newbot</code> untuk mendapatkan Token. Lalu cari <code>@userinfobot</code> untuk melihat Chat ID Anda. Masukkan kedua data tersebut di atas!
          </div>
        </div>
      </div>
    </div>
  );
}
