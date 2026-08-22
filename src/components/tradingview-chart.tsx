'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  theme?: 'dark' | 'light';
  height?: number | string;
  autosize?: boolean;
}

function normalizeToTVSymbol(sym: string): string {
  const clean = sym.toUpperCase().replace('/', '');
  if (clean === 'XAUUSD' || clean === 'GOLD') return 'OANDA:XAUUSD';
  if (clean === 'DXY' || clean === 'USDX') return 'CAPITALCOM:DXY';
  if (clean === 'BTCUSD') return 'BINANCE:BTCUSDT';
  return `FX_IDC:${clean}`;
}

export const TradingViewChart = memo(function TradingViewChart({
  symbol,
  interval = '15',
  theme = 'dark',
  height = 500,
  autosize = false,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = normalizeToTVSymbol(symbol);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget
    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = typeof height === 'number' ? `${height}px` : height;
    widgetContainer.style.width = '100%';
    container.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: autosize,
      width: '100%',
      height: typeof height === 'number' ? height : 500,
      symbol: tvSymbol,
      interval: interval,
      timezone: 'Asia/Jakarta',
      theme: theme,
      style: '1',
      locale: 'id',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      hide_volume: false,
      studies: ['STD;EMA', 'STD;RSI', 'STD;MACD'],
      container_id: 'tradingview_advanced_chart',
    });

    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [tvSymbol, interval, theme, height, autosize]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
});
