// src/composables/useBinanceKlines.ts
import { UTCTimestamp } from 'lightweight-charts';
import { RawKline } from '../types';
import { fetchWithRetry } from '../utils/fetchRetry';

export interface ChartBar {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export async function fetchHistoricalKlines(
  symbol: string,
  interval: string,
  limit = 500
): Promise<ChartBar[]> {
  // Normalize symbol (e.g. BTC/USDT or BTC-USDT to BTCUSDT)
  const normalizedSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const url = `https://api.binance.com/api/v3/klines?symbol=${normalizedSymbol}&interval=${interval}&limit=${limit}`;
  
  const response = await fetchWithRetry(url);
  const data = (await response.json()) as RawKline[];

  return data.map((item) => ({
    time: (item[0] / 1000) as UTCTimestamp,
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[5]),
  }));
}
