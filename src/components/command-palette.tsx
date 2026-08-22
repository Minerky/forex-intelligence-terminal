'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForexStore } from '@/lib/store';
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Newspaper,
  Brain,
  LineChart,
  BookOpen,
  Users,
  Gauge,
  GitCompareArrows,
  Zap,
  Grid3X3,
  Search,
  FlaskConical,
  Waypoints,
  ShieldCheck,
  NotebookPen,
  Bell,
  Star,
  Settings,
  MessageSquare,
  RefreshCw,
  Timer,
  type LucideIcon,
} from 'lucide-react';

interface Command {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  action: () => void;
  keywords: string;
}

export function CommandPalette() {
  const open = useForexStore((s) => s.commandPaletteOpen);
  const togglePalette = useForexStore((s) => s.toggleCommandPalette);
  const toggleAiChat = useForexStore((s) => s.toggleAiChat);
  const setSelectedPair = useForexStore((s) => s.setSelectedPair);
  const updatePrices = useForexStore((s) => s.updatePrices);

  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const nav = useCallback(
    (href: string, pair?: string) => {
      if (pair) setSelectedPair(pair);
      router.push(href);
      togglePalette();
    },
    [router, togglePalette, setSelectedPair],
  );

  const commands: Command[] = [
    // Slash commands
    { id: 'time-signal-eurusd', icon: Timer, label: '/waktu EURUSD', description: 'Sinyal waktu presisi detik EUR/USD', action: () => nav('/time-signal', 'EUR/USD'), keywords: 'waktu time signal detik eurusd tp cl' },
    { id: 'market-eurusd', icon: TrendingUp, label: '/market EURUSD', description: 'Buka EUR/USD di tampilan Pasar', action: () => nav('/market', 'EUR/USD'), keywords: 'market eurusd eur usd pasar' },
    { id: 'market-gbpusd', icon: TrendingUp, label: '/market GBPUSD', description: 'Buka GBP/USD di tampilan Pasar', action: () => nav('/market', 'GBP/USD'), keywords: 'market gbpusd gbp pasar' },
    { id: 'market-usdjpy', icon: TrendingUp, label: '/market USDJPY', description: 'Buka USD/JPY di tampilan Pasar', action: () => nav('/market', 'USD/JPY'), keywords: 'market usdjpy jpy pasar' },
    { id: 'news-usd', icon: Newspaper, label: '/news USD', description: 'Berita difilter untuk USD', action: () => nav('/news'), keywords: 'news berita usd headlines' },
    { id: 'analyze-eurusd', icon: LineChart, label: '/analyze EURUSD', description: 'Analisis teknikal untuk EUR/USD', action: () => nav('/technical', 'EUR/USD'), keywords: 'analyze teknikal analisa eurusd' },
    { id: 'predict-gbpusd', icon: Brain, label: '/predict GBPUSD', description: 'Prediksi AI untuk GBP/USD', action: () => nav('/prediction', 'GBP/USD'), keywords: 'predict prediksi ai forecast gbpusd' },
    { id: 'calendar-today', icon: Calendar, label: '/calendar today', description: 'Kalender ekonomi hari ini', action: () => nav('/calendar'), keywords: 'calendar kalender hari ini events economic' },
    { id: 'scanner-bullish', icon: Search, label: '/scanner bullish', description: 'Pindai setup bullish', action: () => nav('/scanner'), keywords: 'scanner pemindai bullish scan' },
    { id: 'backtest-eurusd', icon: FlaskConical, label: '/backtest EURUSD', description: 'Uji balik strategi EUR/USD', action: () => nav('/backtest', 'EUR/USD'), keywords: 'backtest uji balik eurusd strategi' },
    // Navigation
    { id: 'nav-time-signal', icon: Timer, label: 'Sinyal Waktu & TP/CL', description: 'Waktu hitung mundur & sinyal entry/sell', action: () => nav('/time-signal'), keywords: 'waktu timer countdown sinyal entry sell tp cl cut loss' },
    { id: 'nav-dashboard', icon: LayoutDashboard, label: 'Dasbor', description: 'Buka Dasbor utama', action: () => nav('/dashboard'), keywords: 'dashboard dasbor beranda home' },
    { id: 'nav-market', icon: TrendingUp, label: 'Pasar', description: 'Buka tampilan Pasar', action: () => nav('/market'), keywords: 'market pasar pairs live' },
    { id: 'nav-calendar', icon: Calendar, label: 'Kalender Ekonomi', description: 'Buka Kalender Ekonomi', action: () => nav('/calendar'), keywords: 'calendar kalender events ekonomi' },
    { id: 'nav-news', icon: Newspaper, label: 'Berita Langsung', description: 'Buka Berita Terkini', action: () => nav('/news'), keywords: 'news berita feed headlines' },
    { id: 'nav-technical', icon: LineChart, label: 'Analisis Teknikal', description: 'Buka Analisis Teknikal', action: () => nav('/technical'), keywords: 'technical teknikal analysis chart indikator' },
    { id: 'nav-fundamental', icon: BookOpen, label: 'Analisis Fundamental', description: 'Buka Analisis Fundamental', action: () => nav('/fundamental'), keywords: 'fundamental analysis bank sentral suku bunga' },
    { id: 'nav-sentiment', icon: Users, label: 'Sentimen', description: 'Buka Sentimen Pasar', action: () => nav('/sentiment'), keywords: 'sentiment sentimen crowd risk on off' },
    { id: 'nav-strength', icon: Gauge, label: 'Kekuatan Mata Uang', description: 'Buka Currency Strength Meter', action: () => nav('/strength'), keywords: 'strength kekuatan mata uang currency meter' },
    { id: 'nav-correlation', icon: GitCompareArrows, label: 'Korelasi', description: 'Buka Matriks Korelasi', action: () => nav('/correlation'), keywords: 'correlation korelasi matriks pairs' },
    { id: 'nav-prediction', icon: Brain, label: 'Prediksi AI', description: 'Buka Prediksi Probabilitas AI', action: () => nav('/prediction'), keywords: 'prediction prediksi ai forecast' },
    { id: 'nav-signals', icon: Zap, label: 'Sinyal', description: 'Buka Skor Sinyal Multi-faktor', action: () => nav('/signals'), keywords: 'signals sinyal trade scoring consensus' },
    { id: 'nav-heatmap', icon: Grid3X3, label: 'Peta Panas', description: 'Buka Peta Panas Forex', action: () => nav('/heatmap'), keywords: 'heatmap peta panas market visual' },
    { id: 'nav-scanner', icon: Search, label: 'Pemindai', description: 'Buka Pemindai Peluang Otomatis', action: () => nav('/scanner'), keywords: 'scanner pemindai filter pattern breakout' },
    { id: 'nav-backtest', icon: FlaskConical, label: 'Uji Balik', description: 'Buka Mesin Backtesting', action: () => nav('/backtest'), keywords: 'backtest uji balik simulator trade' },
    { id: 'nav-strategy', icon: Waypoints, label: 'Strategi', description: 'Buka AI Strategy Builder', action: () => nav('/strategy'), keywords: 'strategy strategi builder ai bot' },
    { id: 'nav-risk', icon: ShieldCheck, label: 'Manajemen Risiko', description: 'Buka Kalkulator Risiko & Lot', action: () => nav('/risk'), keywords: 'risk manajemen risiko kalkulator lot position size' },
    { id: 'nav-journal', icon: NotebookPen, label: 'Jurnal Trading', description: 'Buka Jurnal Trading', action: () => nav('/journal'), keywords: 'journal jurnal catatan trade evaluasi' },
    { id: 'nav-alerts', icon: Bell, label: 'Peringatan', description: 'Buka Sistem Notifikasi & Peringatan', action: () => nav('/alerts'), keywords: 'alerts peringatan notifikasi alarm' },
    { id: 'nav-watchlist', icon: Star, label: 'Daftar Pantau', description: 'Buka Daftar Pantau Favorit', action: () => nav('/watchlist'), keywords: 'watchlist daftar pantau favorit' },
    { id: 'nav-settings', icon: Settings, label: 'Pengaturan', description: 'Buka Pengaturan Terminal', action: () => nav('/settings'), keywords: 'settings pengaturan konfigurasi opsi' },
    // Quick actions
    { id: 'act-ai', icon: MessageSquare, label: 'Buka Asisten AI Chat', description: 'Buka atau tutup jendela obrolan AI', action: () => { toggleAiChat(); togglePalette(); }, keywords: 'ai chat asisten tanya obrolan bot' },
    { id: 'act-refresh', icon: RefreshCw, label: 'Perbarui Data Pasar', description: 'Segarkan harga pasar secara langsung', action: () => { updatePrices(); togglePalette(); }, keywords: 'refresh perbarui data update harga' },
  ];

  const filtered = query
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.keywords.includes(q) || c.description.toLowerCase().includes(q);
      })
    : commands;

  // Ctrl+K global listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        togglePalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePalette]);

  // Focus input on open, reset state
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Clamp selected when filter changes
  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault();
      filtered[selected].action();
    } else if (e.key === 'Escape') {
      togglePalette();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[15vh]"
      onClick={togglePalette}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="border-b border-zinc-800 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 outline-none"
          />
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">No commands found</div>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            const active = i === selected;
            return (
              <button
                key={cmd.id}
                onClick={cmd.action}
                onMouseEnter={() => setSelected(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? 'border-l-2 border-emerald-500 bg-zinc-800 text-zinc-100'
                    : 'border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                <Icon size={16} className={active ? 'text-emerald-400' : 'text-zinc-500'} />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{cmd.label}</div>
                  <div className="truncate text-xs text-zinc-500">{cmd.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-zinc-800 px-4 py-2 text-[11px] text-zinc-600">
          <span><kbd className="rounded border border-zinc-700 px-1 py-0.5 text-[10px]">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-zinc-700 px-1 py-0.5 text-[10px]">↵</kbd> select</span>
          <span><kbd className="rounded border border-zinc-700 px-1 py-0.5 text-[10px]">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
