'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForexStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import {
  Newspaper,
  Search,
  Shield,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'All',
  'Central Bank',
  'Interest Rate',
  'Inflation',
  'Employment',
  'GDP',
  'Geopolitical',
  'Commodity',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'NZD',
  'Global Economy',
] as const;

const SORT_OPTIONS = ['Latest', 'Importance', 'Confidence'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const importanceColor: Record<string, string> = {
  Low: 'bg-zinc-600 text-zinc-300',
  Medium: 'bg-yellow-500/20 text-yellow-400',
  High: 'bg-orange-500/20 text-orange-400',
  Critical: 'bg-red-500/20 text-red-400',
};

const sentimentColor: Record<string, string> = {
  'Very Bullish': 'bg-emerald-500/20 text-emerald-400',
  Bullish: 'bg-green-500/20 text-green-400',
  Neutral: 'bg-zinc-500/20 text-zinc-400',
  Bearish: 'bg-orange-500/20 text-orange-400',
  'Very Bearish': 'bg-red-500/20 text-red-400',
};

const importanceRank: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const CURRENCY_CATEGORIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewsPage() {
  const news = useForexStore((s) => s.news);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortOption>('Latest');
  const [search, setSearch] = useState('');
  const [tick, setTick] = useState(0);

  // Auto-refresh tick for relative time updates
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    let items = [...news];

    // Category filter
    if (category !== 'All') {
      if (CURRENCY_CATEGORIES.includes(category)) {
        items = items.filter((n) => n.affectedCurrencies.includes(category as never));
      } else {
        const lower = category.toLowerCase();
        items = items.filter(
          (n) =>
            n.category.toLowerCase().includes(lower) ||
            n.headline.toLowerCase().includes(lower) ||
            n.summary.toLowerCase().includes(lower),
        );
      }
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (n) =>
          n.headline.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q) ||
          n.source.toLowerCase().includes(q),
      );
    }

    // Sort
    if (sort === 'Latest') items.sort((a, b) => b.timestamp - a.timestamp);
    else if (sort === 'Importance')
      items.sort((a, b) => (importanceRank[b.importance] ?? 0) - (importanceRank[a.importance] ?? 0));
    else items.sort((a, b) => b.confidenceScore - a.confidenceScore);

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news, category, sort, search, tick]);

  return (
    <div className="space-y-5">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Berita Langsung &amp; Analisis AI</span>
      </div>

      {/* Header row: search + sort + refresh indicator */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <Newspaper className="h-5 w-5 text-zinc-400" />
          Berita Pasar &amp; Analisis AI
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari berita…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 rounded border border-zinc-700 bg-zinc-800 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="h-8 rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
            >
              <option value="Latest">Terbaru</option>
              <option value="Importance">Tingkat Kepentingan</option>
              <option value="Confidence">Keyakinan AI</option>
            </select>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
            Penyegaran Otomatis
          </span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === c
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* News list */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">No news matching filter.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
            >
              {/* Top row: headline + badges */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-base font-semibold leading-snug text-zinc-100">
                  {item.headline}
                </h2>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${importanceColor[item.importance] ?? 'bg-zinc-600 text-zinc-300'}`}
                  >
                    {item.importance}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${sentimentColor[item.sentiment] ?? 'bg-zinc-600 text-zinc-300'}`}
                  >
                    {item.sentiment}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-zinc-500">
                <span>{formatDistanceToNow(item.timestamp, { addSuffix: true })}</span>
                <span className="text-zinc-600">|</span>
                <span>{item.source}</span>
                <span className="text-zinc-600">|</span>
                <span>{item.category}</span>
              </div>

              {/* Summary */}
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.summary}</p>

              {/* Currency badges */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {item.affectedCurrencies.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500">Affected:</span>
                    {item.affectedCurrencies.map((c) => (
                      <span
                        key={c}
                        className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                {item.bullishCurrencies.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500">Bullish:</span>
                    {item.bullishCurrencies.map((c) => (
                      <span
                        key={c}
                        className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                {item.bearishCurrencies.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500">Bearish:</span>
                    {item.bearishCurrencies.map((c) => (
                      <span
                        key={c}
                        className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom row: impact, horizon, confidence */}
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-zinc-800 pt-3 text-[11px]">
                <div>
                  <span className="text-zinc-500">Impact: </span>
                  <span className="text-zinc-300">{item.potentialImpact}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Horizon: </span>
                  <span className="text-zinc-300">{item.timeHorizon}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Confidence:</span>
                  <div className="h-1.5 w-20 rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${item.confidenceScore}%` }}
                    />
                  </div>
                  <span className="font-mono text-zinc-400">{item.confidenceScore}%</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
