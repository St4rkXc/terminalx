// src/stores/settings.ts
import { defineStore } from 'pinia';
import { Interval, SettingsState } from '../types';

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    defaultSymbol: 'BTCUSDT',
    defaultInterval: '1h' as Interval,
    accentColor: '#00ff88',
    orderBookSymbol: 'BTCUSDT',
  }),
  actions: {
    updateSettings(settings: Partial<SettingsState>) {
      Object.assign(this, settings);
    },
  },
  persist: {
    paths: [
      'defaultSymbol',
      'defaultInterval',
      'accentColor',
      'orderBookSymbol',
    ]
  },
});

