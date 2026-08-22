'use client';

import { useState, useMemo } from 'react';
import { useForexStore } from '@/lib/store';
import type { JournalEntry } from '@/lib/types';
import {
  Shield,
  BookOpen,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Brain,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAIRS = [
  'EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD',
  'NZD/USD','EUR/GBP','EUR/JPY','GBP/JPY',
];

const EMOTIONS = ['Calm','Confident','Fearful','Greedy','Frustrated','FOMO','Revenge'] as const;

const EMPTY: Omit<JournalEntry, 'id' | 'date' | 'result'> = {
  pair: 'EUR/USD',
  direction: 'BUY',
  entry: 0,
  exit: 0,
  lotSize: 0.01,
  strategy: '',
  reason: '',
  emotion: 'Calm',
  mistake: '',
  lesson: '',
  tags: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcPnl(dir: 'BUY' | 'SELL', entry: number, exit: number, lot: number): number {
  const pips = dir === 'BUY' ? exit - entry : entry - exit;
  // Rough P&L: pips * lot * 100000 (standard lot multiplier)
  return +(pips * lot * 100000).toFixed(2);
}

function pnlClass(v: number) {
  return v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-zinc-400';
}

// ---------------------------------------------------------------------------
// AI Analysis generator (deterministic from journal data)
// ---------------------------------------------------------------------------

function generateAiAnalysis(journal: JournalEntry[]): string[] {
  if (journal.length < 3) return [];

  const wins = journal.filter(e => e.result > 0);
  const losses = journal.filter(e => e.result < 0);
  const winRate = ((wins.length / journal.length) * 100).toFixed(1);
  const totalPnl = journal.reduce((s, e) => s + e.result, 0).toFixed(2);

  // Most common emotion
  const emotionCounts: Record<string, number> = {};
  journal.forEach(e => { emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1; });
  const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  // Win rate by emotion
  const emotionWins: Record<string, { w: number; t: number }> = {};
  journal.forEach(e => {
    if (!emotionWins[e.emotion]) emotionWins[e.emotion] = { w: 0, t: 0 };
    emotionWins[e.emotion].t++;
    if (e.result > 0) emotionWins[e.emotion].w++;
  });
  const bestEmotion = Object.entries(emotionWins)
    .filter(([, v]) => v.t >= 2)
    .sort((a, b) => b[1].w / b[1].t - a[1].w / a[1].t)[0];

  // Most common mistake
  const mistakes = journal.filter(e => e.mistake.trim());
  const mistakeText = mistakes.length > 0
    ? `Most frequent mistake pattern relates to: "${mistakes[0].mistake.slice(0, 60)}"`
    : null;

  const insights: string[] = [
    `Overall win rate: ${winRate}% across ${journal.length} trades (${wins.length}W / ${losses.length}L). Net P&L: $${totalPnl}.`,
    `Your most common trading emotion is "${topEmotion}" (${emotionCounts[topEmotion]} trades).`,
  ];

  if (bestEmotion) {
    const [emo, stats] = bestEmotion;
    const wr = ((stats.w / stats.t) * 100).toFixed(0);
    insights.push(`Win rate is highest (${wr}%) when feeling "${emo}". Consider only trading in that state.`);
  }

  const worstEmotion = Object.entries(emotionWins)
    .filter(([, v]) => v.t >= 2)
    .sort((a, b) => a[1].w / a[1].t - b[1].w / b[1].t)[0];
  if (worstEmotion && worstEmotion[0] !== bestEmotion?.[0]) {
    const [emo, stats] = worstEmotion;
    const wr = ((stats.w / stats.t) * 100).toFixed(0);
    insights.push(`Avoid trading when feeling "${emo}" — win rate drops to ${wr}%.`);
  }

  if (mistakeText) insights.push(mistakeText);

  // Direction bias
  const buys = journal.filter(e => e.direction === 'BUY');
  const sells = journal.filter(e => e.direction === 'SELL');
  if (buys.length > sells.length * 2) {
    insights.push('Strong long bias detected. Consider looking for more short setups to diversify.');
  } else if (sells.length > buys.length * 2) {
    insights.push('Strong short bias detected. Consider looking for more long setups to diversify.');
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JournalPage() {
  const journal = useForexStore(s => s.journal);
  const addJournalEntry = useForexStore(s => s.addJournalEntry);
  const removeJournalEntry = useForexStore(s => s.removeJournalEntry);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, tags: [] as string[] });
  const [tagInput, setTagInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    if (journal.length === 0) return null;
    const total = journal.length;
    const wins = journal.filter(e => e.result > 0).length;
    const totalPnl = journal.reduce((s, e) => s + e.result, 0);
    const best = Math.max(...journal.map(e => e.result));
    const worst = Math.min(...journal.map(e => e.result));

    const emotionCounts: Record<string, number> = {};
    journal.forEach(e => { emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1; });
    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

    const mistakeCounts: Record<string, number> = {};
    journal.filter(e => e.mistake.trim()).forEach(e => {
      mistakeCounts[e.mistake] = (mistakeCounts[e.mistake] || 0) + 1;
    });
    const topMistake = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

    return { total, wins, winRate: ((wins / total) * 100).toFixed(1), totalPnl: totalPnl.toFixed(2), best: best.toFixed(2), worst: worst.toFixed(2), topEmotion, topMistake };
  }, [journal]);

  const aiInsights = useMemo(() => generateAiAnalysis(journal), [journal]);

  function handleSave() {
    const result = calcPnl(form.direction, form.entry, form.exit, form.lotSize);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
      pair: form.pair,
      direction: form.direction,
      entry: form.entry,
      exit: form.exit,
      lotSize: form.lotSize,
      strategy: form.strategy,
      reason: form.reason,
      result,
      emotion: form.emotion,
      mistake: form.mistake,
      lesson: form.lesson,
      tags,
    };
    addJournalEntry(entry);
    setForm({ ...EMPTY, tags: [] });
    setTagInput('');
    setShowForm(false);
  }

  const livePnl = form.entry && form.exit ? calcPnl(form.direction, form.entry, form.exit, form.lotSize) : 0;

  return (
    <div className="space-y-6">
      {/* Pro Live badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          <Shield className="h-3 w-3" />
          PRO TRADING TERMINAL
        </span>
        <span className="text-xs text-zinc-500 font-mono">Jurnal Evaluasi Trading</span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Stats Summary                                                     */}
      {/* ----------------------------------------------------------------- */}
      {stats ? (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {([
            ['Total Trade', stats.total],
            ['Win Rate', `${stats.winRate}%`],
            ['Total P&L', `$${stats.totalPnl}`],
            ['Trade Terbaik', `$${stats.best}`],
            ['Trade Terburuk', `$${stats.worst}`],
            ['Emosi Utama', stats.topEmotion],
            ['Kesalahan Utama', stats.topMistake === '-' ? '-' : stats.topMistake.slice(0, 18)],
            ['Menang/Total', `${stats.wins}/${stats.total}`],
          ] as [string, string | number][]).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
              <p className={`mt-1 font-mono text-sm font-semibold ${
                typeof value === 'string' && value.startsWith('$')
                  ? parseFloat(value.slice(1)) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  : 'text-zinc-100'
              }`}>
                {value}
              </p>
            </div>
          ))}
        </section>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500">Mulai catat transaksi trading Anda untuk melihat analitik kinerja</p>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* AI Analysis                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Brain className="h-4 w-4 text-purple-400" /> Analisis Pola Psikologi AI
        </h2>
        {aiInsights.length > 0 ? (
          <ul className="space-y-2">
            {aiInsights.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 italic">
            {journal.length === 0
              ? 'Tambahkan catatan jurnal untuk membuka analitik AI.'
              : `Tambahkan ${3 - journal.length} catatan lagi untuk analisis AI.`}
          </p>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* New Entry Button / Form                                           */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition"
        >
          {showForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Batal' : 'Catat Trade Baru'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300">Catatan Jurnal Baru</h3>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {/* Pair */}
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Pasangan</span>
              <select value={form.pair} onChange={e => setForm(f => ({ ...f, pair: e.target.value }))}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500">
                {PAIRS.map(p => <option key={p}>{p}</option>)}
              </select>
            </label>

            {/* Direction */}
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Arah</span>
              <div className="flex rounded border border-zinc-700 overflow-hidden">
                {(['BUY', 'SELL'] as const).map(d => (
                  <button key={d} onClick={() => setForm(f => ({ ...f, direction: d }))}
                    className={`flex-1 px-2 py-1.5 text-xs font-semibold transition ${
                      form.direction === d
                        ? d === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
            </label>

            {/* Entry Price */}
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Entry Price</span>
              <input type="number" step="any" value={form.entry || ''} onChange={e => setForm(f => ({ ...f, entry: +e.target.value }))}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>

            {/* Exit Price */}
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Exit Price</span>
              <input type="number" step="any" value={form.exit || ''} onChange={e => setForm(f => ({ ...f, exit: +e.target.value }))}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>

            {/* Lot Size */}
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Lot Size</span>
              <input type="number" step="0.01" min="0.01" value={form.lotSize || ''} onChange={e => setForm(f => ({ ...f, lotSize: +e.target.value }))}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>

            {/* Emotion */}
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Emotion</span>
              <select value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {EMOTIONS.map(e => <option key={e}>{e}</option>)}
              </select>
            </label>
          </div>

          {/* Strategy */}
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Strategy</span>
            <input value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))}
              placeholder="e.g. EMA crossover, breakout, news trade..."
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>

          {/* Reason */}
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Reason</span>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2}
              placeholder="Why did you take this trade?"
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Mistake */}
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Mistake (optional)</span>
              <textarea value={form.mistake} onChange={e => setForm(f => ({ ...f, mistake: e.target.value }))} rows={2}
                placeholder="What went wrong?"
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
            </label>

            {/* Lesson */}
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Lesson (optional)</span>
              <textarea value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))} rows={2}
                placeholder="What did you learn?"
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
            </label>
          </div>

          {/* Tags */}
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Tags (comma separated)</span>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              placeholder="e.g. london-session, trend-follow, scalp"
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>

          {/* Live P&L preview */}
          {form.entry > 0 && form.exit > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Estimated P&L:</span>
              <span className={`font-mono font-semibold ${pnlClass(livePnl)}`}>
                {livePnl >= 0 ? '+' : ''}{livePnl.toFixed(2)} USD
              </span>
            </div>
          )}

          <button onClick={handleSave}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-40"
            disabled={!form.entry || !form.exit || !form.strategy}>
            Save Entry
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Journal Table                                                     */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <h2 className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <BarChart3 className="h-4 w-4" /> Trade History
        </h2>

        {journal.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">No entries yet. Click "New Entry" to start.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/50 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Pair</th>
                  <th className="px-4 py-2">Dir</th>
                  <th className="px-4 py-2 text-right font-mono">Entry</th>
                  <th className="px-4 py-2 text-right font-mono">Exit</th>
                  <th className="px-4 py-2 text-right font-mono">Lot</th>
                  <th className="px-4 py-2 text-right font-mono">P&L</th>
                  <th className="px-4 py-2">Strategy</th>
                  <th className="px-4 py-2">Emotion</th>
                  <th className="px-4 py-2">Tags</th>
                  <th className="px-4 py-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {[...journal].reverse().map(e => (
                  <tr key={e.id} className="group">
                    {/* Main row */}
                    <td className="px-4 py-2.5 font-mono text-zinc-400 cursor-pointer" onClick={() => setExpandedId(v => v === e.id ? null : e.id)}>
                      <span className="flex items-center gap-1">
                        {expandedId === e.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {e.date}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-zinc-200">{e.pair}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${e.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {e.direction === 'BUY' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {e.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{e.entry}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{e.exit}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{e.lotSize}</td>
                    <td className={`px-4 py-2.5 text-right font-mono font-semibold ${pnlClass(e.result)}`}>
                      {e.result >= 0 ? '+' : ''}{e.result.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">{e.strategy}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{e.emotion}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {e.tags.map(t => (
                          <span key={t} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => removeJournalEntry(e.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Expanded details */}
            {expandedId && (() => {
              const e = journal.find(j => j.id === expandedId);
              if (!e) return null;
              return (
                <div className="border-t border-zinc-800 bg-zinc-950/30 px-6 py-4 space-y-2 text-sm">
                  {e.reason && <p><span className="text-zinc-500 font-medium">Reason:</span> <span className="text-zinc-300">{e.reason}</span></p>}
                  {e.mistake && <p><span className="text-zinc-500 font-medium">Mistake:</span> <span className="text-amber-400">{e.mistake}</span></p>}
                  {e.lesson && <p><span className="text-zinc-500 font-medium">Lesson:</span> <span className="text-blue-400">{e.lesson}</span></p>}
                </div>
              );
            })()}
          </div>
        )}
      </section>
    </div>
  );
}
