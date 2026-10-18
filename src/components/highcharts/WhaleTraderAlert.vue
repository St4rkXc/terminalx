<!-- src/components/highcharts/WhaleTraderAlert.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';
import { Volume2, VolumeX, ShieldAlert, Filter, Trash2 } from 'lucide-vue-next';

const props = defineProps<{
  symbol: string;
}>();

export interface WhaleAlert {
  id: string;
  time: string;
  timestamp: number;
  price: number;
  qty: number;
  usdValue: number;
  isSell: boolean;
  tier: 'WHALE' | 'MEGA_WHALE';
}

const whaleAlerts = ref<WhaleAlert[]>([]);
const soundEnabled = ref(false);
const filterThreshold = ref(25000); // Default threshold $25,000 USD
let currentSubscription: string | null = null;
let audioCtx: AudioContext | null = null;

const playAlertBeep = (isSell: boolean, isMega: boolean) => {
  if (!soundEnabled.value) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (audioCtx) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = isMega ? 'sawtooth' : 'triangle';
      // Higher tone for BUY whale, lower bass tone for SELL whale dump
      osc.frequency.setValueAtTime(isSell ? 280 : 750, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    }
  } catch {
    // Ignore audio policy errors
  }
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toTimeString().split(' ')[0] + '.' + String(ts % 1000).padStart(3, '0').slice(0, 2);
};

const formatCurrency = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toLocaleString()}`;
};

const handleTrade = (data: any) => {
  const price = parseFloat(data.p);
  const qty = parseFloat(data.q);
  const usdValue = Math.round(price * qty);

  if (usdValue >= filterThreshold.value) {
    const isSell = Boolean(data.m);
    const isMega = usdValue >= 100000;

    const alert: WhaleAlert = {
      id: `${data.t}-${data.E}`,
      time: formatTime(Number(data.E)),
      timestamp: Number(data.E),
      price,
      qty,
      usdValue,
      isSell,
      tier: isMega ? 'MEGA_WHALE' : 'WHALE',
    };

    playAlertBeep(isSell, isMega);

    whaleAlerts.value = [alert, ...whaleAlerts.value.slice(0, 49)];
  }
};

const subscribeStream = () => {
  unsubscribeStream();
  const stream = `${props.symbol.toLowerCase()}@trade`;
  currentSubscription = stream;
  wsManager.subscribe(stream, handleTrade);
};

const unsubscribeStream = () => {
  if (currentSubscription) {
    wsManager.unsubscribe(currentSubscription, handleTrade);
    currentSubscription = null;
  }
};

watch(() => props.symbol, () => {
  whaleAlerts.value = [];
  subscribeStream();
});

onMounted(() => {
  subscribeStream();
});

onUnmounted(() => {
  unsubscribeStream();
});

const totalWhaleBuyUsd = computed(() => {
  return whaleAlerts.value
    .filter((a) => !a.isSell)
    .reduce((sum, a) => sum + a.usdValue, 0);
});

const totalWhaleSellUsd = computed(() => {
  return whaleAlerts.value
    .filter((a) => a.isSell)
    .reduce((sum, a) => sum + a.usdValue, 0);
});

const clearAlerts = () => {
  whaleAlerts.value = [];
};
</script>

<template>
  <div class="h-full w-full bg-[#000000] border border-[#222222] flex flex-col font-mono text-white select-none overflow-hidden">
    <!-- Header -->
    <div class="h-8 border-b border-[#222222] bg-[#050505] px-2.5 flex items-center justify-between text-[10px]">
      <div class="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400">
        <ShieldAlert class="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
        <span>WHALE TRADER ALERTS</span>
        <span class="text-[8px] text-gray-400 px-1 py-0.2 bg-[#121212] border border-[#262626] rounded">
          &gt;{{ formatCurrency(filterThreshold) }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <!-- Min Size Filter -->
        <div class="flex items-center gap-0.5 mr-1">
          <Filter class="h-3 w-3 text-gray-500" />
          <button
            v-for="thresh in [10000, 25000, 50000]"
            :key="thresh"
            @click="filterThreshold = thresh"
            class="px-1 py-0.2 text-[8px] font-bold rounded border transition-all"
            :class="filterThreshold === thresh ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'text-gray-500 border-[#2b2b2b] hover:text-white'"
          >
            {{ thresh / 1000 }}k
          </button>
        </div>

        <!-- Sound Toggle -->
        <button
          @click="soundEnabled = !soundEnabled"
          class="p-1 rounded text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          :title="soundEnabled ? 'Mute Alert Sound' : 'Enable Audio Alert'"
        >
          <Volume2 v-if="soundEnabled" class="h-3.5 w-3.5 text-cyan-400" />
          <VolumeX v-else class="h-3.5 w-3.5" />
        </button>

        <!-- Trash / Clear -->
        <button
          @click="clearAlerts"
          class="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-[#1a1a1a] transition-colors"
          title="Clear alerts"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Live Whale Ratio Bar -->
    <div class="px-2.5 py-1.5 border-b border-[#222222] bg-[#070707] flex flex-col gap-1">
      <div class="flex items-center justify-between text-[8px] font-bold">
        <span class="text-green-400">WHALE BUY: {{ formatCurrency(totalWhaleBuyUsd) }}</span>
        <span class="text-red-400">WHALE SELL: {{ formatCurrency(totalWhaleSellUsd) }}</span>
      </div>
      <div class="h-1.5 w-full bg-[#181818] rounded-full overflow-hidden flex">
        <div
          class="bg-green-500 h-full transition-all duration-300"
          :style="{ width: `${(totalWhaleBuyUsd + totalWhaleSellUsd === 0) ? 50 : (totalWhaleBuyUsd / (totalWhaleBuyUsd + totalWhaleSellUsd)) * 100}%` }"
        ></div>
        <div
          class="bg-red-500 h-full transition-all duration-300"
          :style="{ width: `${(totalWhaleBuyUsd + totalWhaleSellUsd === 0) ? 50 : (totalWhaleSellUsd / (totalWhaleBuyUsd + totalWhaleSellUsd)) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- Alerts Tape List -->
    <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden text-[9px]">
      <table class="w-full border-collapse">
        <thead class="sticky top-0 bg-[#0c0c0c] text-gray-500 border-b border-[#222222] text-[8px] uppercase tracking-wider font-semibold z-10">
          <tr>
            <th class="py-1 px-2 text-left">Time</th>
            <th class="py-1 px-1 text-center">Action</th>
            <th class="py-1 px-2 text-right">Price</th>
            <th class="py-1 px-2 text-right">Value (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="alert in whaleAlerts"
            :key="alert.id"
            class="border-b border-[#141414] hover:bg-[#121212] transition-colors"
            :class="alert.tier === 'MEGA_WHALE' ? (alert.isSell ? 'bg-red-950/20' : 'bg-green-950/20') : ''"
          >
            <td class="py-1 px-2 text-gray-500 whitespace-nowrap">{{ alert.time }}</td>
            <td class="py-1 px-1 text-center whitespace-nowrap">
              <span
                class="px-1.5 py-0.2 rounded text-[7.5px] font-bold uppercase tracking-wider"
                :class="alert.isSell 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                  : 'bg-green-500/20 text-green-400 border border-green-500/40'"
              >
                {{ alert.isSell ? 'WHALE SELL' : 'WHALE BUY' }}
              </span>
            </td>
            <td class="py-1 px-2 text-right text-gray-300 whitespace-nowrap">
              ${{ alert.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) }}
            </td>
            <td
              class="py-1 px-2 text-right font-bold whitespace-nowrap"
              :class="alert.tier === 'MEGA_WHALE' ? 'text-amber-400 font-extrabold animate-pulse' : (alert.isSell ? 'text-red-400' : 'text-green-400')"
            >
              {{ formatCurrency(alert.usdValue) }}
            </td>
          </tr>
          <tr v-if="whaleAlerts.length === 0">
            <td colspan="4" class="py-8 text-center text-gray-600 text-[10px]">
              Monitoring order flow for trades &gt; {{ formatCurrency(filterThreshold) }}...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
