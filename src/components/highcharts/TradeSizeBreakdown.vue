<!-- src/components/highcharts/TradeSizeBreakdown.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';

const props = defineProps<{
  symbol: string;
}>();

interface WhaleAlert {
  time: string;
  price: number;
  qty: number;
  usdValue: number;
  side: 'BUY' | 'SELL';
  id: number;
}

const largeTrades = ref<WhaleAlert[]>([]);
let currentSubscription: string | null = null;
let alertBuffer: WhaleAlert[] = [];
let syncTimer: any = null;

// Counters for trade size distribution (last 300 trades)
const windowTrades = ref<{ qty: number; usdValue: number; side: 'BUY' | 'SELL' }[]>([]);

// Threshold dynamically set per symbol
const whaleThreshold = computed(() => {
  const sym = props.symbol.toUpperCase();
  if (sym.startsWith('BTC')) return 10000; // $10k USD
  if (sym.startsWith('ETH')) return 5000;  // $5k USD
  return 2000; // $2k USD for others
});

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toTimeString().split(' ')[0] + '.' + String(timestamp % 1000).padStart(3, '0');
};

const handleTradeMessage = (data: any) => {
  const price = parseFloat(data.p);
  const qty = parseFloat(data.q);
  const usdValue = price * qty;
  const side = data.m ? 'SELL' : 'BUY'; // maker true = sell, false = buy

  // Update rolling stats window
  windowTrades.value.unshift({ qty, usdValue, side });
  if (windowTrades.value.length > 300) {
    windowTrades.value.pop();
  }

  // Filter for large trades (Whales)
  if (usdValue >= whaleThreshold.value) {
    const newAlert: WhaleAlert = {
      time: formatTime(Number(data.E)),
      price,
      qty,
      usdValue,
      side,
      id: data.t
    };

    alertBuffer.unshift(newAlert);
    if (alertBuffer.length > 50) {
      alertBuffer.length = 50;
    }
  }
};

const startSync = () => {
  stopSync();
  syncTimer = setInterval(() => {
    if (alertBuffer.length > 0) {
      largeTrades.value = [...alertBuffer];
    }
  }, 500); // Sync to UI every 500ms
};

const stopSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
};

// Distribution calculations
const stats = computed(() => {
  let retailVol = 0;
  let mediumVol = 0;
  let whaleVol = 0;
  let totalVol = 0;

  windowTrades.value.forEach(t => {
    totalVol += t.usdValue;
    if (t.usdValue < 1000) {
      retailVol += t.usdValue;
    } else if (t.usdValue < 10000) {
      mediumVol += t.usdValue;
    } else {
      whaleVol += t.usdValue;
    }
  });

  if (totalVol === 0) return { retailPct: 33, mediumPct: 33, whalePct: 34 };

  return {
    retailPct: Math.round((retailVol / totalVol) * 100),
    mediumPct: Math.round((mediumVol / totalVol) * 100),
    whalePct: Math.round((whaleVol / totalVol) * 100)
  };
});

const subscribeToWS = () => {
  unsubscribeFromWS();

  const streamName = `${props.symbol.toLowerCase()}@trade`;
  currentSubscription = streamName;
  wsManager.subscribe(streamName, handleTradeMessage);
  startSync();
};

const unsubscribeFromWS = () => {
  stopSync();
  if (currentSubscription) {
    wsManager.unsubscribe(currentSubscription, handleTradeMessage);
    currentSubscription = null;
  }
};

watch(() => props.symbol, () => {
  largeTrades.value = [];
  alertBuffer = [];
  windowTrades.value = [];
  subscribeToWS();
});

onMounted(() => {
  subscribeToWS();
});

onUnmounted(() => {
  unsubscribeFromWS();
});
</script>

<template>
  <div class="w-full h-full border border-[#222222] bg-[#000000] rounded p-2 flex flex-col font-mono text-[10px] select-none">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#222222] pb-1 mb-2 font-bold text-white uppercase text-[9px] tracking-wider">
      <span>WHALE TRADE ALERTS</span>
      <span class="text-accent-green uppercase animate-pulse">LIVE SPREAD</span>
    </div>

    <!-- Stats Bar -->
    <div class="mb-3 space-y-1">
      <div class="flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-wide">
        <span class="text-blue-400">Retail: {{ stats.retailPct }}%</span>
        <span class="text-amber-500">Medium: {{ stats.mediumPct }}%</span>
        <span class="text-green-400">Whale: {{ stats.whalePct }}%</span>
      </div>
      <div class="w-full h-2 bg-[#111111] rounded overflow-hidden flex border border-[#222222]">
        <div class="h-full bg-blue-500 transition-all duration-300" :style="{ width: `${stats.retailPct}%` }"></div>
        <div class="h-full bg-amber-500 transition-all duration-300" :style="{ width: `${stats.mediumPct}%` }"></div>
        <div class="h-full bg-green-500 transition-all duration-300" :style="{ width: `${stats.whalePct}%` }"></div>
      </div>
    </div>

    <!-- Alert Log Table -->
    <div class="flex-1 overflow-y-auto scrollbar-thin text-[#cccccc] min-h-0">
      <div v-if="largeTrades.length === 0" class="h-full flex items-center justify-center text-center text-gray-500 text-[9px]">
        WAITING FOR LARGE TRADES (> ${{ whaleThreshold.toLocaleString() }})...
      </div>
      <table v-else class="w-full text-left">
        <thead>
          <tr class="text-gray-500 border-b border-[#111111] font-normal uppercase text-[8px]">
            <th class="py-1">TIME</th>
            <th class="py-1">SIDE</th>
            <th class="py-1 text-right">PRICE</th>
            <th class="py-1 text-right">USD VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="trade in largeTrades" 
            :key="trade.id" 
            class="hover:bg-[#111111] transition-colors border-b border-[#111111]/30 font-bold"
            :class="trade.side === 'SELL' ? 'text-red-500' : 'text-green-500'"
          >
            <td class="py-0.5 text-gray-400 font-normal">{{ trade.time }}</td>
            <td class="py-0.5 font-bold uppercase">{{ trade.side }}</td>
            <td class="py-0.5 text-right text-white">
              {{ trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </td>
            <td class="py-0.5 text-right font-mono font-bold">
              ${{ Math.round(trade.usdValue).toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #222;
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #333;
}
</style>
