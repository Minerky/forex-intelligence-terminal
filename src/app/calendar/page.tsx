'use client';

import { useState, useMemo } from 'react';
import { useForexStore } from '@/lib/store';
import type { Currency, EconomicEvent } from '@/lib/types';
import { Search, ChevronDown, ChevronUp, Shield, ArrowUpDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
const IMPACTS = ['Low', 'Medium', 'High', 'Extreme'] as const;

const impactDot: Record<string, string> = {
  Low: 'bg-zinc-500',
  Medium: 'bg-yellow-500',
  High: 'bg-orange-500',
  Extreme: 'bg-red-500',
};

const impactText: Record<string, string> = {
  Low: 'text-zinc-500',
  Medium: 'text-yellow-500',
  High: 'text-orange-500',
  Extreme: 'text-red-500',
};

type SortKey = 'time' | 'impact' | 'currency';

const impactOrder: Record<string, number> = { Low: 0, Medium: 1, High: 2, Extreme: 3 };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const events = useForexStore((s) => s.events);

  // Filters
  const [selectedCurrencies, setSelectedCurrencies] = useState<Set<Currency>>(new Set(CURRENCIES));
  const [selectedImpacts, setSelectedImpacts] = useState<Set<string>>(new Set(IMPACTS));
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleCurrency = (c: Currency) => {
    setSelectedCurrencies((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  };

  const toggleImpact = (imp: string) => {
    setSelectedImpacts((prev) => {
      const next = new Set(prev);
      next.has(imp) ? next.delete(imp) : next.add(imp);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = events.filter(
      (e) =>
        selectedCurrencies.has(e.currency) &&
        selectedImpacts.has(e.impact) &&
        (q === '' || e.event.toLowerCase().includes(q) || e.currency.toLowerCase().includes(q) || e.country.toLowerCase().includes(q)),
    );

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'time') cmp = `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
      else if (sortKey === 'impact') cmp = impactOrder[a.impact] - impactOrder[b.impact];
      else if (sortKey === 'currency') cmp = a.currency.localeCompare(b.currency);
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [events, selectedCurrencies, selectedImpacts, search, sortKey, sortAsc]);

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 inline-flex text-zinc-600">
      {sortKey === col ? (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Kalender Ekonomi</span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Filter bar                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari acara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 py-1.5 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-600"
          />
        </div>

        {/* Currency toggles */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Mata Uang</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCurrency(c)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  selectedCurrencies.has(c)
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Impact toggles */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Dampak</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {IMPACTS.map((imp) => (
              <button
                key={imp}
                onClick={() => toggleImpact(imp)}
                className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  selectedImpacts.has(imp)
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${impactDot[imp]}`} />
                {imp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Events table                                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              {([['Waktu', 'time'], ['Mata Uang', 'currency'], ['Acara', null], ['Dampak', 'impact'], ['Perkiraan', null], ['Sebelumnya', null], ['Aktual', null], ['Deviasi', null]] as [string, SortKey | null][]).map(
                ([label, key]) => (
                  <th
                    key={label}
                    className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 ${key ? 'cursor-pointer select-none hover:text-zinc-300' : ''}`}
                    onClick={key ? () => handleSort(key) : undefined}
                  >
                    <span className="inline-flex items-center">
                      {label}
                      {key && <SortIcon col={key} />}
                    </span>
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-zinc-500">
                  Tidak ada acara sesuai filter saat ini.
                </td>
              </tr>
            )}
            {filtered.map((ev, i) => (
              <EventRow
                key={ev.id}
                ev={ev}
                odd={i % 2 === 1}
                expanded={expandedId === ev.id}
                onToggle={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event row + expandable detail
// ---------------------------------------------------------------------------

function EventRow({
  ev,
  odd,
  expanded,
  onToggle,
}: {
  ev: EconomicEvent;
  odd: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/40 ${
          odd ? 'bg-zinc-900/40' : 'bg-zinc-900'
        }`}
      >
        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-300">
          <span className="text-zinc-500">{ev.date.slice(5)}</span>{' '}
          {ev.time}
        </td>
        <td className="px-3 py-2">
          <span className="inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
            {ev.currency}
          </span>
        </td>
        <td className="px-3 py-2 text-zinc-200">{ev.event}</td>
        <td className="px-3 py-2">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${impactDot[ev.impact]}`} />
            <span className={`text-xs font-medium ${impactText[ev.impact]}`}>{ev.impact}</span>
          </span>
        </td>
        <td className="px-3 py-2 font-mono text-xs text-zinc-300">{ev.forecast || '—'}</td>
        <td className="px-3 py-2 font-mono text-xs text-zinc-400">{ev.previous || '—'}</td>
        <td className="px-3 py-2 font-mono text-xs text-zinc-200 font-semibold">{ev.actual || '—'}</td>
        <td className="px-3 py-2 font-mono text-xs text-zinc-400">{ev.deviation || '—'}</td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={8} className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Dampak Historis" value={ev.historicalImpact} />
              <Detail label="Volatilitas Rata-rata" value={ev.avgVolatility} />
              <Detail label="Pasangan Terkait" value={ev.relatedPairs.join(', ')} />
              <Detail label="Reaksi Tipikal" value={ev.typicalReaction} />
              <Detail label="Win Rate Historis" value={`${ev.historicalWinRate}%`} />
              <Detail label="Interpretasi AI" value={ev.aiInterpretation} highlight />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-sm ${highlight ? 'text-amber-300' : 'text-zinc-300'}`}>{value}</p>
    </div>
  );
}
