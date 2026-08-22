'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForexStore } from '@/lib/store';
import type { CurrencyPair } from '@/lib/types';
import { Search, Shield, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

type SortKey = keyof CurrencyPair | 'macdValue' | 'spreadVal';

interface Col {
  label: string;
  key: SortKey | null;
  align?: 'right';
  render: (p: CurrencyPair) => React.ReactNode;
}

const dec = (p: CurrencyPair) => (p.symbol.includes('JPY') ? 2 : 4);

const trendBadge: Record<string, string> = {
  Bullish: 'bg-emerald-400/10 text-emerald-400',
  Bearish: 'bg-red-400/10 text-red-400',
  Neutral: 'bg-zinc-400/10 text-zinc-400',
};

const volBadge: Record<string, string> = {
  High: 'text-red-400',
  Medium: 'text-amber-400',
  Low: 'text-zinc-400',
};

function rsiColor(rsi: number): string {
  if (rsi < 30) return 'text-emerald-400';
  if (rsi > 70) return 'text-red-400';
  return 'text-zinc-200';
}

function aiScoreColor(s: number): string {
  if (s >= 60) return 'text-emerald-400';
  if (s >= 40) return 'text-amber-400';
  return 'text-red-400';
}

const COLUMNS: Col[] = [
  { label: 'Pasangan', key: 'symbol', render: (p) => <span className="font-medium text-zinc-100">{p.symbol}</span> },
  { label: 'Bid', key: 'bid', align: 'right', render: (p) => p.bid.toFixed(dec(p)) },
  { label: 'Ask', key: 'ask', align: 'right', render: (p) => p.ask.toFixed(dec(p)) },
  { label: 'Spread', key: 'spreadVal', align: 'right', render: (p) => p.spread.toFixed(1) },
  { label: 'Harga', key: 'price', align: 'right', render: (p) => p.price.toFixed(dec(p)) },
  {
    label: 'Perubahan', key: 'change', align: 'right',
    render: (p) => (
      <span className={p.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
        {p.change >= 0 ? '+' : ''}{p.change.toFixed(dec(p))}
      </span>
    ),
  },
  {
    label: 'Chg%', key: 'changePercent', align: 'right',
    render: (p) => (
      <span className={p.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
        {p.changePercent >= 0 ? '+' : ''}{p.changePercent.toFixed(2)}%
      </span>
    ),
  },
  { label: 'Tertinggi', key: 'high', align: 'right', render: (p) => p.high.toFixed(dec(p)) },
  { label: 'Terendah', key: 'low', align: 'right', render: (p) => p.low.toFixed(dec(p)) },
  { label: 'Buka', key: 'open', align: 'right', render: (p) => p.open.toFixed(dec(p)) },
  { label: 'Pntpn Sblm', key: 'previousClose', align: 'right', render: (p) => p.previousClose.toFixed(dec(p)) },
  { label: 'ATR', key: 'atr', align: 'right', render: (p) => p.atr.toFixed(dec(p)) },
  {
    label: 'RSI', key: 'rsi', align: 'right',
    render: (p) => <span className={rsiColor(p.rsi)}>{p.rsi.toFixed(1)}</span>,
  },
  {
    label: 'MACD', key: 'macdValue', align: 'right',
    render: (p) => (
      <span className={p.macd.histogram >= 0 ? 'text-emerald-400' : 'text-red-400'}>
        {p.macd.value.toFixed(dec(p) + 1)}
      </span>
    ),
  },
  {
    label: 'Tren', key: 'trend',
    render: (p) => (
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${trendBadge[p.trend]}`}>{p.trend}</span>
    ),
  },
  {
    label: 'Volatilitas', key: 'volatility',
    render: (p) => <span className={`text-xs font-medium ${volBadge[p.volatility]}`}>{p.volatility}</span>,
  },
  {
    label: 'Sentimen', key: 'sentiment',
    render: (p) => {
      const bull = p.sentiment.includes('Bullish');
      const bear = p.sentiment.includes('Bearish');
      return (
        <span className={`text-xs ${bull ? 'text-emerald-400' : bear ? 'text-red-400' : 'text-zinc-400'}`}>
          {p.sentiment}
        </span>
      );
    },
  },
  {
    label: 'Skor AI', key: 'aiScore', align: 'right',
    render: (p) => <span className={`font-bold ${aiScoreColor(p.aiScore)}`}>{p.aiScore}</span>,
  },
];

// ---------------------------------------------------------------------------
// Value extractor for sorting
// ---------------------------------------------------------------------------

function sortVal(p: CurrencyPair, key: SortKey): number | string {
  if (key === 'macdValue') return p.macd.value;
  if (key === 'spreadVal') return p.spread;
  const v = p[key as keyof CurrencyPair];
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v;
  return 0;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketPage() {
  const pairs = useForexStore((s) => s.pairs);
  const updatePrices = useForexStore((s) => s.updatePrices);
  const selectedPair = useForexStore((s) => s.selectedPair);
  const setSelectedPair = useForexStore((s) => s.setSelectedPair);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortAsc, setSortAsc] = useState(true);

  // Price flash tracking
  const prevPrices = useRef<Record<string, number>>({});
  const [flashes, setFlashes] = useState<Record<string, 'up' | 'down'>>({});

  // Live update
  useEffect(() => {
    const id = setInterval(updatePrices, 2000);
    return () => clearInterval(id);
  }, [updatePrices]);

  // Detect price changes and flash
  useEffect(() => {
    const next: Record<string, 'up' | 'down'> = {};
    for (const p of pairs) {
      const prev = prevPrices.current[p.symbol];
      if (prev !== undefined && prev !== p.price) {
        next[p.symbol] = p.price > prev ? 'up' : 'down';
      }
      prevPrices.current[p.symbol] = p.price;
    }
    if (Object.keys(next).length > 0) {
      setFlashes(next);
      const t = setTimeout(() => setFlashes({}), 400);
      return () => clearTimeout(t);
    }
  }, [pairs]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) { setSortAsc((a) => !a); return prev; }
      setSortAsc(true);
      return key;
    });
  }, []);

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    let list = pairs.filter((p) => q === '' || p.symbol.toLowerCase().includes(q));
    list = [...list].sort((a, b) => {
      const av = sortVal(a, sortKey);
      const bv = sortVal(b, sortKey);
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [pairs, search, sortKey, sortAsc]);

  return (
    <div className="space-y-4">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Data Pasar Langsung</span>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
            placeholder="Cari pasangan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-900 py-1.5 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-600"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-zinc-800 bg-zinc-900">
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={`whitespace-nowrap px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.key ? 'cursor-pointer select-none hover:text-zinc-300' : ''}`}
                  onClick={col.key ? () => handleSort(col.key!) : undefined}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.key && (
                      <span className="ml-0.5 text-zinc-600">
                        {sortKey === col.key ? (
                          sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-2.5 w-2.5" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const flash = flashes[p.symbol];
              const isSelected = p.symbol === selectedPair;
              return (
                <tr
                  key={p.symbol}
                  onClick={() => setSelectedPair(p.symbol)}
                  className={`cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/40 ${
                    isSelected ? 'bg-zinc-800/60 ring-1 ring-inset ring-zinc-700' : 'bg-zinc-900'
                  } ${
                    flash === 'up'
                      ? 'bg-emerald-500/10'
                      : flash === 'down'
                        ? 'bg-red-500/10'
                        : ''
                  }`}
                >
                  {COLUMNS.map((col) => (
                    <td
                      key={col.label}
                      className={`whitespace-nowrap px-2 py-1.5 text-zinc-300 ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.render(p)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
