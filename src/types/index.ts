// src/types/index.ts

export type Interval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
export type ChartType = 'candlestick' | 'line' | 'bar' | 'area';
export type Exchange = 'binance' | 'polygon';
export type TabType = 'dashboard' | 'charts';
export type WorkspaceTemplate = 'multi' | 'compare' | 'focused';
export type AssetMode = 'stocks' | 'crypto';

export interface Panel {
  id: string;
  tabId: string;
  symbol: string;
  exchange: Exchange;
  interval: Interval;
  chartType: ChartType;
  position: number;
  showVolume: boolean;
}

export interface Tab {
  id: string;
  name: string;
  type: TabType;
  template: WorkspaceTemplate;
  assetMode: AssetMode;
  panels: Panel[];
  createdAt: number;
  updatedAt: number;
  compareSplitPct?: number;
}

export interface WorkspaceState {
  version: '1.0';
  activeTabId: string;
  tabs: Tab[];
}

export interface SettingsState {
  finnhubApiKey: string;
  polygonApiKey: string;
  fmpApiKey: string;
  defaultSymbol: string;
  defaultInterval: Interval;
  accentColor: string;
  orderBookSymbol: string;
  stockOrderBookSymbol: string;
}

export interface RecentTrade {
  id: number;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  time: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPct: number;
  lastUpdateId: number;
}

export interface NewsItem {
  id: number;
  headline: string;
  source: string;
  datetime: number;
  url: string;
  category: string;
  summary: string;
}

export interface CalendarEvent {
  id: string;
  datetime: number;
  event: string;
  country: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

export type RawKline = [
  number,  // Open time ms
  string,  // Open
  string,  // High
  string,  // Low
  string,  // Close
  string,  // Volume
  number,  // Close time ms
  string,  // Quote asset volume
  number,  // Trades
  string,  // Taker buy base vol
  string,  // Taker buy quote vol
  string   // Ignore
];

export interface BinanceKlineEvent {
  e: 'kline';
  E: number;
  s: string;
  k: {
    t: number;  // Open time
    T: number;  // Close time
    s: string;  // Symbol
    i: string;  // Interval
    o: string;  // Open price
    c: string;  // Close price
    h: string;  // High price
    l: string;  // Low price
    v: string;  // Base asset volume
    n: number;  // Number of trades
    x: boolean; // Is this kline closed?
    q: string;  // Quote asset volume
  };
}

export interface StockQuote {
  c: number;   // Current price
  d: number;   // Change
  dp: number;  // Percent change
  h: number;   // High
  l: number;   // Low
  o: number;   // Open
  pc: number;  // Previous close
  t: number;   // Timestamp
}

export interface FinnhubCandleResponse {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string;   // Status
  t: number[]; // Timestamps (seconds)
  v: number[]; // Volumes
}

