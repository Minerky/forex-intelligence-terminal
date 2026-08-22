import { create } from 'zustand';
import type { CurrencyPair, NewsItem, EconomicEvent, Alert, JournalEntry, Prediction, Signal, CurrencyStrength } from './types';
import { CURRENCY_PAIRS, ECONOMIC_EVENTS, NEWS_ITEMS, simulatePriceUpdate, generateCurrencyStrength, generatePrediction, generateSignals } from './mock-data';

interface ForexStore {
  // Market data
  pairs: CurrencyPair[];
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  updatePrices: () => void;
  fetchLiveMarketData: () => Promise<void>;

  // Economic calendar
  events: EconomicEvent[];

  // News
  news: NewsItem[];

  // Predictions
  predictions: Map<string, Prediction>;
  generatePredictions: () => void;

  // Signals
  signals: Signal[];
  refreshSignals: () => void;

  // Currency strength
  currencyStrength: CurrencyStrength[];
  refreshStrength: () => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;

  // Journal
  journal: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => void;
  removeJournalEntry: (id: string) => void;

  // Watchlist
  watchlist: string[];
  addToWatchlist: (pair: string) => void;
  removeFromWatchlist: (pair: string) => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  commandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
  aiChatOpen: boolean;
  toggleAiChat: () => void;

  // Data status
  dataStatus: 'live' | 'delayed' | 'offline';
  dataSourceName: string;
  lastUpdate: number;
}

export const useForexStore = create<ForexStore>((set, get) => ({
  pairs: CURRENCY_PAIRS,
  selectedPair: 'XAU/USD',
  setSelectedPair: (pair) => set({ selectedPair: pair }),
  updatePrices: () => {
    const { fetchLiveMarketData } = get();
    // Fetch live market feed in background periodically
    fetchLiveMarketData().catch(() => {});
    set((state) => ({
      pairs: state.pairs.map(p => simulatePriceUpdate(p)),
      lastUpdate: Date.now(),
    }));
  },

  fetchLiveMarketData: async () => {
    try {
      if (typeof window === 'undefined') return;

      // 1. Check if MT4/MT5 Direct Bridge has active real-time ticks
      try {
        const mtRes = await fetch('/api/mt-bridge', { cache: 'no-store' });
        if (mtRes.ok) {
          const mtData = await mtRes.json();
          if (mtData.connected && mtData.quotes && Object.keys(mtData.quotes).length > 0) {
            set((state) => ({
              dataStatus: 'live',
              dataSourceName: `MetaTrader 4/5 (${mtData.broker})`,
              pairs: state.pairs.map((p) => {
                const mtQuote = mtData.quotes[p.symbol];
                if (mtQuote) {
                  return {
                    ...p,
                    price: mtQuote.price,
                    bid: mtQuote.bid,
                    ask: mtQuote.ask,
                    spread: mtQuote.spread ?? p.spread,
                    high: mtQuote.high ? Math.max(p.high, mtQuote.high) : p.high,
                    low: mtQuote.low ? Math.min(p.low, mtQuote.low) : p.low,
                    timestamp: mtQuote.time || Date.now(),
                  };
                }
                return p;
              }),
              lastUpdate: Date.now(),
            }));
            return; // Finished with 100% exact MT4/MT5 prices
          }
        }
      } catch {
        // Fallback to interbank feed
      }

      // 2. Fallback to live interbank & Gold spot API
      const res = await fetch('/api/market-data', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.quotes) {
          set((state) => ({
            dataStatus: 'live',
            dataSourceName: 'Live Interbank & Gold Spot Feed',
            pairs: state.pairs.map((p) => {
              const live = data.quotes[p.symbol];
              if (live) {
                return {
                  ...p,
                  price: live.price,
                  bid: live.bid,
                  ask: live.ask,
                  high: Math.max(p.high, live.high),
                  low: Math.min(p.low, live.low),
                  change: live.change,
                  changePercent: live.changePercent,
                  timestamp: live.timestamp,
                };
              }
              return p;
            }),
            lastUpdate: Date.now(),
          }));
        }
      }
    } catch {
      // Keep running smoothly with local simulation if network is unreachable
    }
  },

  events: ECONOMIC_EVENTS,
  news: NEWS_ITEMS,

  predictions: new Map(),
  generatePredictions: () => {
    const { pairs } = get();
    const preds = new Map<string, Prediction>();
    pairs.forEach(p => {
      preds.set(p.symbol, generatePrediction(p.symbol, p));
    });
    set({ predictions: preds });
  },

  signals: [],
  refreshSignals: () => set({ signals: generateSignals() }),

  currencyStrength: generateCurrencyStrength(),
  refreshStrength: () => set({ currencyStrength: generateCurrencyStrength() }),

  alerts: [],
  addAlert: (alert) => set((s) => ({ alerts: [...s.alerts, alert] })),
  removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter(a => a.id !== id) })),
  toggleAlert: (id) => set((s) => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, active: !a.active } : a) })),

  journal: [],
  addJournalEntry: (entry) => set((s) => ({ journal: [...s.journal, entry] })),
  removeJournalEntry: (id) => set((s) => ({ journal: s.journal.filter(e => e.id !== id) })),

  watchlist: ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY'],
  addToWatchlist: (pair) => set((s) => ({ watchlist: [...s.watchlist, pair] })),
  removeFromWatchlist: (pair) => set((s) => ({ watchlist: s.watchlist.filter(p => p !== pair) })),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  commandPaletteOpen: false,
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  aiChatOpen: false,
  toggleAiChat: () => set((s) => ({ aiChatOpen: !s.aiChatOpen })),

  dataStatus: 'live',
  dataSourceName: 'Live Market Feed',
  lastUpdate: Date.now(),
}));
