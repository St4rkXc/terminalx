// src/utils/chartTheme.ts
import { ChartOptions, DeepPartial } from 'lightweight-charts';

export const chartThemeOptions = (_accentColor = '#00ff88'): DeepPartial<ChartOptions> => ({
  layout: {
    background: { color: '#000000' },
    textColor: '#888888',
    fontSize: 10,
    fontFamily: 'JetBrains Mono, monospace',
  },
  grid: {
    vertLines: { color: '#111111' },
    horzLines: { color: '#111111' },
  },
  rightPriceScale: {
    borderColor: '#1a1a1a',
    visible: true,
  },
  timeScale: {
    borderColor: '#1a1a1a',
    timeVisible: true,
    secondsVisible: false,
  },
  crosshair: {
    vertLine: {
      color: '#333333',
      width: 1,
      style: 3, // Dashed
      labelBackgroundColor: '#111111',
    },
    horzLine: {
      color: '#333333',
      width: 1,
      style: 3, // Dashed
      labelBackgroundColor: '#111111',
    },
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: true,
    pinch: true,
  },
});

export const candleSeriesOptions = (accentColor = '#00ff88') => ({
  upColor: accentColor,
  downColor: '#ff4444',
  borderUpColor: accentColor,
  borderDownColor: '#ff4444',
  wickUpColor: accentColor,
  wickDownColor: '#ff4444',
});

export const volumeSeriesOptions = () => ({
  color: '#333333',
  priceFormat: {
    type: 'volume' as const,
  },
  priceScaleId: 'volume', // render in overlay or separate scale
});
