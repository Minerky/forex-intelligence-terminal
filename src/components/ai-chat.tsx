'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForexStore } from '@/lib/store';
import { X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'ai',
  text: "Halo! Saya Asisten AI Forex Anda. Tanyakan kondisi pasar, analisis pasangan mata uang, atau strategi trading. Catatan: Data yang digunakan adalah data simulasi pengembangan.",
  timestamp: Date.now(),
};

const PAIR_NAMES = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD',
  'USD/CAD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
];

function findPair(msg: string): string | null {
  const upper = msg.toUpperCase();
  for (const p of PAIR_NAMES) {
    if (upper.includes(p) || upper.includes(p.replace('/', ''))) return p;
  }
  return null;
}

export function AiChat() {
  const open = useForexStore((s) => s.aiChatOpen);
  const toggle = useForexStore((s) => s.toggleAiChat);
  const pairs = useForexStore((s) => s.pairs);
  const currencyStrength = useForexStore((s) => s.currencyStrength);
  const news = useForexStore((s) => s.news);
  const predictions = useForexStore((s) => s.predictions);
  const signals = useForexStore((s) => s.signals);

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const generateResponse = useCallback(
    (msg: string): string => {
      const lower = msg.toLowerCase();
      const pair = findPair(msg);

      // Pair analysis
      if (pair) {
        const p = pairs.find((x) => x.symbol === pair);
        if (p) {
          return [
            `**Analisis ${p.symbol}**`,
            `Harga: ${p.price} (${p.change >= 0 ? '+' : ''}${p.change} / ${p.changePercent}%)`,
            `RSI: ${p.rsi} | Tren: ${p.trend} | Sentimen: ${p.sentiment}`,
            `Skor AI: ${p.aiScore}/100 | Volatilitas: ${p.volatility}`,
            `Rentang: ${p.low} – ${p.high} | Spread: ${p.spread}`,
            `Histogram MACD: ${p.macd.histogram > 0 ? 'Positif (momentum bullish)' : 'Negatif (momentum bearish)'}`,
          ].join('\n');
        }
      }

      // Market overview
      if (lower.includes('market') || lower.includes('overview') || lower.includes('pasar')) {
        const lines = pairs.map(
          (p) =>
            `${p.symbol}: ${p.price} (${p.change >= 0 ? '+' : ''}${p.changePercent}%) — ${p.trend}`,
        );
        return `**Ringkasan Pasar**\n${lines.join('\n')}`;
      }

      // Currency strength
      if (lower.includes('strength') || lower.includes('currency') || lower.includes('kekuatan')) {
        const lines = currencyStrength.map(
          (c) => `${c.rank}. ${c.currency}: ${c.strength} (momentum ${c.momentum >= 0 ? '+' : ''}${c.momentum})`,
        );
        return `**Peringkat Kekuatan Mata Uang**\n${lines.join('\n')}`;
      }

      // News
      if (lower.includes('news') || lower.includes('berita')) {
        const top = news.slice(0, 5);
        const lines = top.map(
          (n) => `• [${n.importance}] ${n.headline} — ${n.source}`,
        );
        return `**Berita Terkini**\n${lines.join('\n')}`;
      }

      // Prediction
      if (lower.includes('predict') || lower.includes('prediction') || lower.includes('prediksi')) {
        const target = pair || 'EUR/USD';
        const pred = predictions.get(target);
        if (pred) {
          return [
            `**Prediksi ${target}**`,
            `Arah: ${pred.direction} | Keputusan: ${pred.verdict}`,
            `Kepercayaan: ${pred.confidence}% | R:R ${pred.riskReward}`,
            `Target TP: ${pred.target} | Invalidasi: ${pred.invalidation}`,
            `Support: ${pred.support} | Resistance: ${pred.resistance}`,
            `Alasan: ${pred.reasons.join('; ')}`,
          ].join('\n');
        }
        return `Data prediksi belum tersedia untuk ${target}. Silakan buka halaman Prediksi AI untuk memuat ulang.`;
      }

      // Signals / risk / best setups
      if (lower.includes('risk') || lower.includes('setup') || lower.includes('best') || lower.includes('signal') || lower.includes('sinyal')) {
        if (signals.length === 0) {
          return 'Belum ada sinyal yang dihasilkan. Kunjungi halaman Sinyal untuk memperbarui.';
        }
        const top = [...signals].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);
        const lines = top.map(
          (s) =>
            `${s.pair}: ${s.direction} — Skor ${s.totalScore}/100, Kepercayaan ${s.confidence}%, R:R ${s.riskReward}`,
        );
        return `**Sinyal Teratas**\n${lines.join('\n')}`;
      }

      return "Saya dapat membantu analisis pasangan mata uang, ringkasan pasar, kekuatan mata uang, berita, prediksi harga probabilitas, dan sinyal entry/sell. Coba tanyakan tentang EUR/USD atau pasangan lainnya.";
    },
    [pairs, currencyStrength, news, predictions, signals],
  );

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text, timestamp: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const response = generateResponse(text);
      const aiMsg: Message = { id: crypto.randomUUID(), role: 'ai', text: response, timestamp: Date.now() };
      setMessages((m) => [...m, aiMsg]);
      setTyping(false);
    }, 500);
  };

  if (!open) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={toggle}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full sm:w-[400px] flex-col border-l border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
          <Bot size={16} className="text-emerald-400" />
          Asisten AI Forex
        </div>
        <button
          onClick={toggle}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Tutup obrolan AI"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
                m.role === 'user'
                  ? 'bg-emerald-900/30 text-emerald-100'
                  : 'bg-zinc-800 text-zinc-200'
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {m.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                {m.role === 'user' ? 'You' : 'AI'}
              </div>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-zinc-800 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Tanyakan analisis EUR/USD, sinyal, ikhtisar pasar..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-600"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
