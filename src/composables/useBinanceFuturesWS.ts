// src/composables/useBinanceFuturesWS.ts
import { ref } from 'vue';
import { LiquidationOrder } from '../types';

type ConnectionStatus = 'online' | 'connecting' | 'offline';

class BinanceFuturesWSManager {
  private ws: WebSocket | null = null;
  public status = ref<ConnectionStatus>('offline');
  public liquidations = ref<LiquidationOrder[]>([]);
  public totalLongLiqUsd = ref(0);
  public totalShortLiqUsd = ref(0);
  public soundEnabled = ref(false);

  private reconnectTimeout: any = null;
  private reconnectDelay = 1500;
  private maxReconnectDelay = 30000;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.connect();
  }

  private playAlertSound() {
    if (!this.soundEnabled.value) return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
      }
    } catch {
      // Audio playback ignore on strict browser policies
    }
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.status.value = 'connecting';
    // Binance Futures All Market Liquidation Order stream
    this.ws = new WebSocket('wss://fstream.binance.com/ws/!forceOrder@arr');

    this.ws.onopen = () => {
      this.status.value = 'online';
      this.reconnectDelay = 1500;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.e === 'forceOrder' && data.o) {
          const o = data.o;
          const price = parseFloat(o.ap || o.p);
          const quantity = parseFloat(o.q);
          const usdValue = Math.round(price * quantity);
          const side = o.S as 'BUY' | 'SELL';

          const liqItem: LiquidationOrder = {
            id: `${data.E}-${o.s}-${Math.random().toString(36).substring(2, 6)}`,
            symbol: o.s,
            side: side,
            price: price,
            quantity: quantity,
            usdValue: usdValue,
            time: data.E,
          };

          // Update metrics (SELL side liquidation = LONG position rekt, BUY side liquidation = SHORT position rekt)
          if (side === 'SELL') {
            this.totalLongLiqUsd.value += usdValue;
          } else {
            this.totalShortLiqUsd.value += usdValue;
          }

          if (usdValue >= 30000) {
            this.playAlertSound();
          }

          // Prepend and limit size to last 60 records
          this.liquidations.value = [liqItem, ...this.liquidations.value.slice(0, 59)];
        }
      } catch (err) {
        console.error('[Futures WS] parse error:', err);
      }
    };

    this.ws.onclose = () => {
      this.status.value = 'offline';
      this.ws = null;
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      if (this.ws) {
        this.ws.close();
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  public clearStats() {
    this.totalLongLiqUsd.value = 0;
    this.totalShortLiqUsd.value = 0;
    this.liquidations.value = [];
  }
}

export const futuresWSManager = new BinanceFuturesWSManager();
