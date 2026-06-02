// src/stores/settings.ts
import { defineStore } from 'pinia';
import { Interval, SettingsState } from '../types';

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    finnhubApiKey: import.meta.env.VITE_FINNHUB_API_KEY || '',
    polygonApiKey: import.meta.env.VITE_POLYGON_API_KEY || '',
    fmpApiKey: import.meta.env.VITE_FMP_API_KEY || '',
    defaultSymbol: 'BTCUSDT',
    defaultInterval: '1h' as Interval,
    accentColor: '#00ff88',
    orderBookSymbol: 'BTCUSDT',
    assetMode: 'stocks',
    stockOrderBookSymbol: 'AAPL',
  }),
  actions: {
    saveKeys(keys: { finnhub: string; polygon: string; fmp: string }) {
      this.finnhubApiKey = keys.finnhub;
      this.polygonApiKey = keys.polygon;
      this.fmpApiKey = keys.fmp;
    },
    updateSettings(settings: Partial<SettingsState>) {
      Object.assign(this, settings);
    },
    toggleAssetMode() {
      this.assetMode = this.assetMode === 'stocks' ? 'crypto' : 'stocks';
    },
  },
  persist: true,
});
