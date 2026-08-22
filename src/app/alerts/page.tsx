'use client';

import { useState } from 'react';
import { useForexStore } from '@/lib/store';
import type { Alert } from '@/lib/types';
import {
  Shield,
  Bell,
  BellRing,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Clock,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAIRS = [
  'EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD',
  'NZD/USD','EUR/GBP','EUR/JPY','GBP/JPY',
];

const ALERT_TYPES = [
  'Price Alert','RSI Alert','MACD Alert','EMA Crossover','Breakout',
  'News Release','High Volatility','AI Signal','AI Confidence','Spread Alert',
] as const;

const CONDITIONS = ['Above','Below','Crosses Above','Crosses Below','Equals'] as const;

const TEMPLATES: { label: string; type: string; pair: string; condition: string; value: number }[] = [
  { label: 'EUR/USD above 1.0900', type: 'Price Alert', pair: 'EUR/USD', condition: 'Above', value: 1.09 },
  { label: 'RSI oversold on GBP/USD', type: 'RSI Alert', pair: 'GBP/USD', condition: 'Below', value: 30 },
  { label: 'AI confidence > 80% on any pair', type: 'AI Confidence', pair: 'EUR/USD', condition: 'Above', value: 80 },
  { label: 'High impact news in next 1 hour', type: 'News Release', pair: 'EUR/USD', condition: 'Equals', value: 60 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusDot(alert: Alert) {
  if (alert.triggered) return 'bg-amber-400';
  if (alert.active) return 'bg-emerald-400';
  return 'bg-zinc-500';
}

function statusLabel(alert: Alert) {
  if (alert.triggered) return 'Triggered';
  if (alert.active) return 'Active';
  return 'Inactive';
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AlertsPage() {
  const alerts = useForexStore(s => s.alerts);
  const addAlert = useForexStore(s => s.addAlert);
  const removeAlert = useForexStore(s => s.removeAlert);
  const toggleAlert = useForexStore(s => s.toggleAlert);

  const [form, setForm] = useState<{ type: string; pair: string; condition: string; value: number }>({ type: ALERT_TYPES[0], pair: PAIRS[0], condition: CONDITIONS[0], value: 0 });

  function handleCreate(overrides?: Partial<typeof form>) {
    const data = overrides ? { ...form, ...overrides } : form;
    const alert: Alert = {
      id: Date.now().toString(),
      type: data.type,
      pair: data.pair,
      condition: data.condition,
      value: data.value,
      active: true,
      triggered: false,
      createdAt: Date.now(),
    };
    addAlert(alert);
    if (!overrides) setForm({ type: ALERT_TYPES[0], pair: PAIRS[0], condition: CONDITIONS[0], value: 0 });
  }

  const activeAlerts = alerts.filter(a => a.active && !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);
  const inactiveAlerts = alerts.filter(a => !a.active && !a.triggered);

  return (
    <div className="space-y-6">
      {/* Pro Live badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          <Shield className="h-3 w-3" />
          PRO TRADING TERMINAL
        </span>
        <span className="text-xs text-zinc-500 font-mono">Sistem Peringatan Harga &amp; Sinyal</span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Create Alert Form                                                 */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Plus className="h-4 w-4" /> Buat Peringatan Baru
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {/* Type */}
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Tipe Peringatan</span>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {ALERT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>

          {/* Pair */}
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Pasangan</span>
            <select value={form.pair} onChange={e => setForm(f => ({ ...f, pair: e.target.value }))}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500">
              {PAIRS.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>

          {/* Condition */}
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Kondisi</span>
            <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>

          {/* Value */}
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Nilai Ambang</span>
            <input type="number" step="any" value={form.value || ''} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>

          {/* Submit */}
          <div className="flex items-end">
            <button onClick={() => handleCreate()}
              className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-40"
              disabled={!form.value}>
              Simpan Peringatan
            </button>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Quick Templates                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Zap className="h-4 w-4 text-yellow-400" /> Template Cepat
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map(t => (
            <button key={t.label} onClick={() => handleCreate(t)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-300 hover:border-blue-600/50 hover:bg-zinc-800 transition">
              <div className="flex items-center gap-2">
                <BellRing className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                {t.label}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Active Alerts Table                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <h2 className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Bell className="h-4 w-4" /> All Alerts
          <span className="ml-auto text-[10px] text-zinc-600 font-mono">{alerts.length} total</span>
        </h2>

        {alerts.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">No alerts configured. Create one above or use a quick template.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/50 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2 w-4" />
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Pair</th>
                  <th className="px-4 py-2">Condition</th>
                  <th className="px-4 py-2 text-right font-mono">Value</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {[...alerts].reverse().map(a => (
                  <tr key={a.id} className="group">
                    <td className="px-4 py-2.5">
                      <span className={`inline-block h-2 w-2 rounded-full ${statusDot(a)}`} />
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300">{a.type}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-zinc-200">{a.pair}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{a.condition}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{a.value}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-semibold uppercase ${
                        a.triggered ? 'text-amber-400' : a.active ? 'text-emerald-400' : 'text-zinc-500'
                      }`}>
                        {statusLabel(a)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-zinc-500">{fmtTime(a.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleAlert(a.id)} className="text-zinc-500 hover:text-zinc-200 transition" title={a.active ? 'Deactivate' : 'Activate'}>
                          {a.active
                            ? <ToggleRight className="h-4 w-4 text-emerald-400" />
                            : <ToggleLeft className="h-4 w-4" />
                          }
                        </button>
                        <button onClick={() => removeAlert(a.id)} className="text-zinc-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Alert History (triggered)                                         */}
      {/* ----------------------------------------------------------------- */}
      {triggeredAlerts.length > 0 && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Clock className="h-4 w-4 text-amber-400" /> Alert History (Triggered)
          </h2>
          <div className="space-y-2">
            {triggeredAlerts.map(a => (
              <div key={a.id} className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                <span className="font-mono font-semibold text-zinc-200">{a.pair}</span>
                <span className="text-zinc-400">{a.type} — {a.condition} {a.value}</span>
                {a.triggeredAt && <span className="ml-auto font-mono text-zinc-500">{fmtTime(a.triggeredAt)}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
