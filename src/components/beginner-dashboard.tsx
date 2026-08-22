'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForexStore, isMarketOpenNow } from '@/lib/store';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Calculator,
  Copy,
  Check,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

const GLOSSARY_TERMS = [
  {
    term: 'Akun Cent (USC)',
    desc: 'Akun khusus pemula di mana $10 USD berubah menjadi 1.000 USC (Cent). Sangat aman untuk belajar dengan risiko kerugian sekecil uang jajan (ribuan rupiah).',
  },
  {
    term: 'Lot',
    desc: 'Ukuran volume transaksi. Semakin kecil lot (misal 0.01), semakin kecil keuntungan dan kerugian Anda per pergerakan harga.',
  },
  {
    term: 'Stop Loss / CL (Cut Loss)',
    desc: 'Batas proteksi otomatis untuk membatasi kerugian jika analisa salah, sehingga saldo modal tidak habis.',
  },
  {
    term: 'Take Profit / TP',
    desc: 'Target harga otomatis untuk mengunci keuntungan ketika target profit telah tercapai.',
  },
  {
    term: 'Pip / Poin',
    desc: 'Satuan unit terkecil perubahan harga di pasar forex atau emas (XAU/USD).',
  },
  {
    term: 'Drawdown (DD)',
    desc: 'Persentase penurunan modal dari titik tertinggi ke titik terendah saat trading.',
  },
];

export function BeginnerDashboard() {
  const pairs = useForexStore((s) => s.pairs);
  const events = useForexStore((s) => s.events);
  const signals = useForexStore((s) => s.signals);
  const [copied, setCopied] = useState(false);
  const [activeGlossary, setActiveGlossary] = useState<string | null>(null);

  // Quick beginner calculations
  const [modalUSD, setModalUSD] = useState(50);
  const [accountType, setAccountType] = useState<'cent' | 'standard'>('cent');

  const marketOpen = isMarketOpenNow();
  const topGoldSignal = signals.find((s) => s.pair === 'XAU/USD') || signals[0];
  const goldPair = pairs.find((p) => p.symbol === 'XAU/USD');

  // Traffic light status
  const hasHighImpactSoon = events.some(
    (e) => e.impact === 'High' || e.impact === 'Extreme'
  );

  let trafficStatus = {
    color: 'emerald',
    badge: '🟢 AMAN ENTRY',
    title: 'Kondisi Pasar Normal & Kondusif',
    desc: 'Tidak ada berita berdampak ekstrim dalam waktu dekat. Anda bisa mengikuti sinyal AI yang tersedia dengan disiplin lot.',
  };

  if (!marketOpen) {
    trafficStatus = {
      color: 'amber',
      badge: '🟡 PASAR LIBUR (AKHIR PEKAN)',
      title: 'Pasar Forex Sedang Tutup',
      desc: 'Pasar tutup dari Sabtu pagi sampai Senin subuh (WIB). Pelajari materi atau buat simulasi rencana trading untuk minggu depan.',
    };
  } else if (hasHighImpactSoon) {
    trafficStatus = {
      color: 'red',
      badge: '🔴 WASPADA BERITA HIGH-IMPACT',
      title: 'Ada Jadwal Berita Penting Hari Ini',
      desc: 'Hindari membuka posisi baru mendekati jam rilis berita (cek menu Kalender). Lonjakan harga bisa sangat liar!',
    };
  }

  const handleCopySignal = () => {
    if (!topGoldSignal) return;
    const text = `Sinyal AI ${topGoldSignal.pair}\nAksi: ${topGoldSignal.direction}\nEntry: ${topGoldSignal.entry}\nTP: ${topGoldSignal.takeProfit}\nSL: ${topGoldSignal.stopLoss}\nRekomendasi Lot: 0.01 Cent`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Welcome & Traffic Light Alert */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                Mode Panduan Pemula Aktif
              </span>
              <span className="text-xs text-zinc-500">Trading Tanpa Pusing Rumus Rumit</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Panduan Langkah Trading Hari Ini 🚀
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Ikuti 4 langkah sederhana di bawah ini untuk memulai transaksi dengan risiko terukur.
            </p>
          </div>

          {/* Traffic Light Status Card */}
          <div
            className={`rounded-xl border p-4 flex items-center gap-3.5 shrink-0 ${
              trafficStatus.color === 'emerald'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : trafficStatus.color === 'amber'
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                : 'bg-red-950/40 border-red-500/30 text-red-300'
            }`}
          >
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                trafficStatus.color === 'emerald'
                  ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-400'
                  : trafficStatus.color === 'amber'
                  ? 'bg-amber-500/20 border border-amber-400 text-amber-400'
                  : 'bg-red-500/20 border border-red-400 text-red-400'
              }`}
            >
              {trafficStatus.color === 'emerald' ? '✓' : '!'}
            </div>
            <div className="max-w-xs">
              <div className="text-xs font-bold tracking-wide uppercase">
                {trafficStatus.badge}
              </div>
              <div className="text-xs text-zinc-200 font-semibold mt-0.5">
                {trafficStatus.title}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                {trafficStatus.desc}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Step-by-Step 4 Steps Action Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Step 1 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                Langkah 1
              </span>
              <ShieldCheck className="h-4 w-4 text-zinc-500" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Cek Status Pasar</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Pasar saat ini: <strong className={marketOpen ? 'text-emerald-400' : 'text-amber-400'}>{marketOpen ? 'BUKA' : 'TUTUP (Libur)'}</strong>.
            </p>
            <div className="mt-3 text-[11px] text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
              💡 <em>Tips:</em> Jangan pernah trading saat lelah atau terburu-buru. Disiplin adalah kunci utama.
            </div>
          </div>
          <Link
            href="/calendar"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-emerald-400 pt-2 border-t border-zinc-800"
          >
            <span>Lihat Jam Kalender</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Step 2 */}
        <div className="rounded-xl border border-emerald-500/30 bg-zinc-900 p-4 relative flex flex-col justify-between ring-1 ring-emerald-500/20">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                Langkah 2 (Rekomendasi AI)
              </span>
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">
              Sinyal Pilihan: {topGoldSignal?.pair || 'XAU/USD'}
            </h3>
            <div className="mt-2 space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Arah:</span>
                <span
                  className={`font-bold ${
                    topGoldSignal?.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {topGoldSignal?.direction || 'BUY'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Harga Sekarang:</span>
                <span className="text-zinc-200 font-bold">
                  {goldPair?.price?.toFixed(2) || '2650.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Target Untung (TP):</span>
                <span className="text-emerald-400 font-bold">{topGoldSignal?.takeProfit || 2675.00}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Proteksi Rugi (SL):</span>
                <span className="text-red-400 font-bold">{topGoldSignal?.stopLoss || 2638.00}</span>
              </div>
            </div>
          </div>
          <Link
            href="/time-signal"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-emerald-400 hover:underline pt-2 border-t border-zinc-800"
          >
            <span>Buka Sinyal Waktu Lengkap</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Step 3 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                Langkah 3
              </span>
              <Calculator className="h-4 w-4 text-zinc-500" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Tentukan Ukuran Lot Aman</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Gunakan mode <strong>Akun Cent</strong> dengan lot <strong>0.01 - 0.05</strong> untuk menjaga ketahanan modal hingga ribuan poin.
            </p>
            <div className="mt-3 text-[11px] text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              Contoh Modal <strong>$50 USD</strong> = <strong>5.000 USC (Cent)</strong>.<br />
              Risiko max 1 trade = hanya Rp 10.000!
            </div>
          </div>
          <Link
            href="/risk"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-emerald-400 pt-2 border-t border-zinc-800"
          >
            <span>Kalkulator Modal &amp; Lot</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Step 4 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                Langkah 4
              </span>
              <Timer className="h-4 w-4 text-zinc-500" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Eksekusi di MT4 / MT5</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Buka aplikasi MetaTrader di HP/Laptop, masukkan angka TP &amp; SL persis sesuai sinyal, lalu klik tombol Pasang.
            </p>
            <button
              onClick={handleCopySignal}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 py-2 text-xs font-semibold text-zinc-200 transition border border-zinc-700"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Salin Format Sinyal MT5</span>
                </>
              )}
            </button>
          </div>
          <Link
            href="/action-plan"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-emerald-400 pt-2 border-t border-zinc-800"
          >
            <span>Lihat Rencana Harian</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* 3. Interactive Beginner Lot & Cold Money Calculator */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Simulasi Modal &amp; Ketahanan Akun Pemula
            </h2>
            <span className="text-xs text-zinc-500">Live Kalkulator</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-300">
                Berapa modal dingin yang ingin Anda siapkan (USD)?
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="number"
                  min={10}
                  max={10000}
                  value={modalUSD}
                  onChange={(e) => setModalUSD(Number(e.target.value) || 10)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-sm font-mono text-zinc-400 font-bold">USD</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccountType('cent')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition border ${
                  accountType === 'cent'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ⭐ Akun Cent (Paling Aman untuk Pemula)
              </button>
              <button
                type="button"
                onClick={() => setAccountType('standard')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition border ${
                  accountType === 'standard'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Akun Standard ($ USD)
              </button>
            </div>

            <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Saldo Terlihat di MT4/MT5:</span>
                <span className="font-mono font-bold text-white">
                  {accountType === 'cent'
                    ? `${(modalUSD * 100).toLocaleString()} ¢ USC (Cent)`
                    : `$${modalUSD.toLocaleString()} USD`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Rekomendasi Ukuran Lot:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {accountType === 'cent' ? '0.01 - 0.05 Lot' : '0.01 Lot (Disiplin)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Ketahanan Floating Rugi (SL 30 Poin Emas):</span>
                <span className="font-mono font-bold text-zinc-200">
                  {accountType === 'cent'
                    ? `Hanya rugi ${(30 * 0.01 * 100).toFixed(0)} Cent (~Rp ${(
                        30 *
                        0.01 *
                        160
                      ).toFixed(0)})`
                    : `Rugi $${(30 * 0.01 * 10).toFixed(1)} (~Rp ${(
                        30 *
                        0.01 *
                        10 *
                        16000
                      ).toLocaleString()})`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-zinc-400">Status Keamanan Psikologis:</span>
                <span className="font-bold text-emerald-400">
                  {accountType === 'cent'
                    ? '100% Tenang, Tidak Mengganggu Tidur'
                    : 'Wajib Disiplin Cut Loss'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Kamus Istilah Forex Praktis (Glossary) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-emerald-400" />
              Kamus Cepat Istilah Trading (Bahasa Awam)
            </h2>
            <span className="text-xs text-zinc-500">Klik untuk Buka Arti</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {GLOSSARY_TERMS.map((item) => {
              const isOpen = activeGlossary === item.term;
              return (
                <div
                  key={item.term}
                  onClick={() => setActiveGlossary(isOpen ? null : item.term)}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    isOpen
                      ? 'bg-zinc-950 border-emerald-500/50 shadow-md'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
                    <span>{item.term}</span>
                    <span className="text-emerald-400 text-[10px]">{isOpen ? 'Tutup' : 'Buka'}</span>
                  </div>
                  {isOpen && (
                    <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-2">
                      {item.desc}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-3 text-[11px] text-emerald-300 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>
              <strong>Aturan Emas:</strong> Jangan pernah gunakan uang dapur, uang pinjaman, atau uang darurat untuk trading. Selalu gunakan modal dingin yang rela Anda kelola untuk belajar.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
