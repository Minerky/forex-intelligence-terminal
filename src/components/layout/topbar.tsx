'use client';

import { useEffect, useState } from 'react';
import { useForexStore } from '@/lib/store';
import { Menu, Command } from 'lucide-react';

// Market sessions: hours in UTC
const SESSIONS = [
  { name: 'Sydney', openUTC: 22, closeUTC: 7 },
  { name: 'Tokyo', openUTC: 0, closeUTC: 9 },
  { name: 'London', openUTC: 7, closeUTC: 16 },
  { name: 'New York', openUTC: 12, closeUTC: 21 },
] as const;

function isSessionOpen(openUTC: number, closeUTC: number, hour: number): boolean {
  if (openUTC < closeUTC) return hour >= openUTC && hour < closeUTC;
  // wraps midnight
  return hour >= openUTC || hour < closeUTC;
}

const TICKER_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];

export function Topbar() {
  const toggleSidebar = useForexStore((s) => s.toggleSidebar);
  const toggleCommandPalette = useForexStore((s) => s.toggleCommandPalette);
  const pairs = useForexStore((s) => s.pairs);
  const dataStatus = useForexStore((s) => s.dataStatus);

  const [utcTime, setUtcTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Ctrl+K handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleCommandPalette]);

  const utcHour = utcTime.getUTCHours();
  const timeStr = utcTime.toISOString().slice(11, 19);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-3">
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={16} />
      </button>

      {/* Branding */}
      <span className="hidden whitespace-nowrap text-xs font-semibold tracking-wide text-zinc-300 sm:block">
        Terminal Intelijen Forex
      </span>

      {/* Session indicators */}
      <div className="hidden items-center gap-2 border-l border-zinc-800 pl-3 md:flex">
        {SESSIONS.map((s) => {
          const open = isSessionOpen(s.openUTC, s.closeUTC, utcHour);
          return (
            <span key={s.name} className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide">
              <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
              <span className={open ? 'text-zinc-200' : 'text-zinc-600'}>{s.name}</span>
            </span>
          );
        })}
      </div>

      {/* Ticker strip */}
      <div className="flex flex-1 items-center gap-3 overflow-x-auto border-l border-zinc-800 pl-3 scrollbar-none">
        {TICKER_PAIRS.map((symbol) => {
          const p = pairs.find((x) => x.symbol === symbol);
          if (!p) return null;
          const up = p.changePercent >= 0;
          return (
            <span key={symbol} className="flex shrink-0 items-center gap-1 font-mono text-[11px]">
              <span className="text-zinc-500">{symbol}</span>
              <span className={up ? 'text-emerald-400' : 'text-red-400'}>
                {p.price.toFixed(symbol.includes('JPY') ? 2 : 4)}
              </span>
              <span className={`${up ? 'text-emerald-500' : 'text-red-500'} text-[10px]`}>
                {up ? '+' : ''}{p.changePercent.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 border-l border-zinc-800 pl-3">
        {/* UTC clock */}
        <span className="hidden font-mono text-[11px] text-zinc-400 lg:block">
          {timeStr} <span className="text-zinc-600">UTC</span>
        </span>

        {/* Data status */}
        <span className="flex items-center gap-1 text-[10px] font-medium uppercase text-zinc-500">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              dataStatus === 'live' ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]' :
              dataStatus === 'delayed' ? 'bg-amber-400' : 'bg-red-400'
            }`}
          />
          {dataStatus}
        </span>

        {/* Command palette button */}
        <button
          onClick={toggleCommandPalette}
          className="hidden items-center gap-1 rounded border border-zinc-800 px-2 py-1 text-[10px] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 sm:flex"
        >
          <Command size={10} />
          <span>Ctrl+K</span>
        </button>
      </div>
    </header>
  );
}
