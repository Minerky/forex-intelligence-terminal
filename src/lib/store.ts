import { create } from 'zustand';
import type { CurrencyPair, NewsItem, EconomicEvent, Alert, JournalEntry, Prediction, Signal, CurrencyStrength } from './types';
import { CURRENCY_PAIRS, ECONOMIC_EVENTS, NEWS_ITEMS, simulatePriceUpdate, generateCurrencyStrength, generatePrediction, generateSignals } from './mock-data';

interface ForexStore {
  // Market data
  pairs: CurrencyPair[];
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  updatePrices: () => void;

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
  lastUpdate: number;
}

export const useForexStore = create<ForexStore>((set, get) => ({
  pairs: CURRENCY_PAIRS,
  selectedPair: 'EUR/USD',
  setSelectedPair: (pair) => set({ selectedPair: pair }),
  updatePrices: () => set((state) => ({
    pairs: state.pairs.map(p => simulatePriceUpdate(p)),
    lastUpdate: Date.now(),
  })),

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

  watchlist: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'],
  addToWatchlist: (pair) => set((s) => ({ watchlist: [...s.watchlist, pair] })),
  removeFromWatchlist: (pair) => set((s) => ({ watchlist: s.watchlist.filter(p => p !== pair) })),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  commandPaletteOpen: false,
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  aiChatOpen: false,
  toggleAiChat: () => set((s) => ({ aiChatOpen: !s.aiChatOpen })),

  dataStatus: 'live',
  lastUpdate: Date.now(),
}));
