'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForexStore } from '@/lib/store';
import {
  Shield,
  Settings,
  Bell,
  Database,
  AlertTriangle,
  Info,
  Moon,
  Sun,
  Radio,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppSettings {
  theme: 'dark' | 'light';
  timezone: string;
  defaultPair: string;
  updateFrequency: number;
  numberFormat: 'comma-dot' | 'dot-comma';
  priceAlerts: boolean;
  newsAlerts: boolean;
  aiSignalAlerts: boolean;
  economicEventAlerts: boolean;
  soundNotifications: boolean;
  cacheDuration: number;
  apiKey: string;
  defaultRiskPercent: number;
  defaultRRTarget: number;
  accountCurrency: string;
}

const DEFAULTS: AppSettings = {
  theme: 'dark',
  timezone: 'UTC',
  defaultPair: 'EUR/USD',
  updateFrequency: 2,
  numberFormat: 'comma-dot',
  priceAlerts: true,
  newsAlerts: true,
  aiSignalAlerts: true,
  economicEventAlerts: false,
  soundNotifications: false,
  cacheDuration: 60,
  apiKey: '',
  defaultRiskPercent: 1,
  defaultRRTarget: 2,
  accountCurrency: 'USD',
};

const TIMEZONES = [
  'UTC',
  'US/Eastern',
  'US/Pacific',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD',
  'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
];

const UPDATE_FREQUENCIES = [
  { value: 1, label: '1 second' },
  { value: 2, label: '2 seconds' },
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
];

const CACHE_DURATIONS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];

const STORAGE_KEY = 'forex-terminal-settings';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* noop */ }
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, update, loaded };
}

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'bg-blue-600' : 'bg-zinc-800'
      }`}
    >
      <span
        className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

function Select({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-zinc-200">{label}</p>
        {description && <p className="mt-0.5 text-[11px] text-zinc-500">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const pairs = useForexStore((s) => s.pairs);
  const { settings, update, loaded } = useSettings();

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Dev badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <Shield className="h-3 w-3" />
          DATA PENGEMBANGAN
        </span>
        <span className="text-xs text-zinc-500 font-mono">Pengaturan</span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* General Settings                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Pengaturan Umum" icon={Settings}>
        <Row label="Tema Tampilan">
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 rounded border border-blue-500 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400"
              disabled
            >
              <Moon className="h-3 w-3" /> Gelap (Dark)
            </button>
            <button
              className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-500 cursor-not-allowed opacity-50"
              disabled
            >
              <Sun className="h-3 w-3" /> Terang (Light)
              <span className="ml-1 text-[10px] text-zinc-600">segera hadir</span>
            </button>
          </div>
        </Row>

        <Row label="Zona Waktu" description="Digunakan untuk waktu kalender dan grafik">
          <Select
            value={settings.timezone}
            onChange={(v) => update({ timezone: v })}
            options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
          />
        </Row>

        <Row label="Pasangan Utama">
          <Select
            value={settings.defaultPair}
            onChange={(v) => update({ defaultPair: v })}
            options={PAIRS.map((p) => ({ value: p, label: p }))}
          />
        </Row>

        <Row label="Frekuensi Pembaruan" description="Interval penyegaran harga pasar">
          <Select
            value={settings.updateFrequency}
            onChange={(v) => update({ updateFrequency: Number(v) })}
            options={UPDATE_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))}
          />
        </Row>

        <Row label="Format Angka">
          <Select
            value={settings.numberFormat}
            onChange={(v) => update({ numberFormat: v as AppSettings['numberFormat'] })}
            options={[
              { value: 'comma-dot', label: '1,234.56' },
              { value: 'dot-comma', label: '1.234,56' },
            ]}
          />
        </Row>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Notification Settings                                             */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Pengaturan Notifikasi" icon={Bell}>
        <Row label="Peringatan Harga" description="Notifikasi saat target harga tersentuh">
          <Toggle checked={settings.priceAlerts} onChange={(v) => update({ priceAlerts: v })} />
        </Row>
        <Row label="Peringatan Berita" description="Pemberitahuan berita penting breaking news">
          <Toggle checked={settings.newsAlerts} onChange={(v) => update({ newsAlerts: v })} />
        </Row>
        <Row label="Peringatan Sinyal AI" description="Saat sistem AI merilis sinyal trading baru">
          <Toggle checked={settings.aiSignalAlerts} onChange={(v) => update({ aiSignalAlerts: v })} />
        </Row>
        <Row label="Peringatan Kalender Ekonomi" description="Pengingat acara ekonomi berdampak tinggi">
          <Toggle checked={settings.economicEventAlerts} onChange={(v) => update({ economicEventAlerts: v })} />
        </Row>
        <Row label="Suara Notifikasi Audio">
          <Toggle checked={settings.soundNotifications} onChange={(v) => update({ soundNotifications: v })} />
        </Row>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* MetaTrader 4 / 5 Live Bridge                                       */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Koneksi MetaTrader 4 / 5 (Sinkronisasi Broker)" icon={Radio}>
        <div className="space-y-3 text-xs leading-relaxed text-zinc-400">
          <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200">Status Jembatan MT4/MT5:</span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Endpoint Webhook Siap
              </span>
            </div>
            <p>
              Kirim tick harga real-time dari broker Anda (Exness, XM, IC Markets, dll) ke endpoint:
            </p>
            <div className="rounded bg-zinc-900 px-3 py-1.5 font-mono text-zinc-300 select-all border border-zinc-800">
              POST /api/mt-bridge
            </div>
            <p className="text-[11px] text-zinc-500">
              Format payload JSON: <code className="text-zinc-400">{`{ "broker": "NamaBroker", "quotes": { "XAUUSD": { "bid": 2938.50, "ask": 2938.85 } } }`}</code>
            </p>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Data Settings                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Sumber Data" icon={Database}>
        <Row label="Penyedia Data">
          <div className="text-right">
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
              TradingView Real-Time Feed (Forex &amp; Gold)
            </span>
          </div>
        </Row>
        <p className="text-[11px] text-zinc-500">
          Data harga spot Emas (XAU/USD) dan pasangan forex utama disinkronkan langsung secara real-time dari TradingView Scanner Engine.
        </p>

        <Row label="API Key">
          <input
            type="text"
            disabled
            placeholder="Masukkan API key untuk data live"
            className="w-56 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-500 placeholder:text-zinc-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          />
        </Row>

        <Row label="Durasi Cache" description="Lama penyimpanan cache respons API">
          <Select
            value={settings.cacheDuration}
            onChange={(v) => update({ cacheDuration: Number(v) })}
            options={CACHE_DURATIONS.map((c) => ({ value: c.value, label: c.label }))}
          />
        </Row>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Risk Management Defaults                                          */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Default Manajemen Risiko" icon={AlertTriangle}>
        <Row label="Default Risiko %" description="Persentase saldo akun yang dirisikokan per trade">
          <input
            type="number"
            min={0.1}
            max={10}
            step={0.1}
            value={settings.defaultRiskPercent}
            onChange={(e) => update({ defaultRiskPercent: Number(e.target.value) })}
            className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-right text-sm text-zinc-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </Row>

        <Row label="Target R:R Default" description="Rasio target risiko terhadap imbalan">
          <input
            type="number"
            min={0.5}
            max={10}
            step={0.5}
            value={settings.defaultRRTarget}
            onChange={(e) => update({ defaultRRTarget: Number(e.target.value) })}
            className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-right text-sm text-zinc-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </Row>

        <Row label="Account Currency">
          <Select
            value={settings.accountCurrency}
            onChange={(v) => update({ accountCurrency: v })}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </Row>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* About                                                             */}
      {/* ----------------------------------------------------------------- */}
      <Section title="About" icon={Info}>
        <div className="space-y-2 text-sm text-zinc-400">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono text-zinc-300">1.0.0-dev</span>
          </div>
          <div className="flex justify-between">
            <span>Application</span>
            <span className="text-zinc-300">Forex Intelligence Terminal</span>
          </div>
        </div>

        <div className="mt-3 rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Using development data. Not for real trading.
          </p>
        </div>

        <div className="mt-3 space-y-1 text-[11px] text-zinc-600">
          <p>Built with Next.js, React, Zustand, Tailwind CSS, Recharts, Lucide Icons</p>
          <p>Market data is simulated for development and demonstration purposes.</p>
        </div>
      </Section>
    </div>
  );
}
