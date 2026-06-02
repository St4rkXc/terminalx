<!-- src/components/highcharts/OrderFlowImbalance.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';

const props = defineProps<{
  symbol: string;
  assetMode?: string;
}>();

interface TradeRecord {
  qty: number;
  isSell: boolean;
  time: number;
}

const recentTrades = ref<TradeRecord[]>([]);
let currentSubscription: string | null = null;
const windowSize = 200; // Track last 200 trades
let tradeBuffer: TradeRecord[] = [];
let syncTimer: any = null;

const handleTradeMessage = (data: any) => {
  const qty = parseFloat(data.q);
  const isSell = data.m; // true = sell, false = buy

  tradeBuffer.unshift({
    qty,
    isSell,
    time: Number(data.E)
  });

  if (tradeBuffer.length > windowSize) {
    tradeBuffer.length = windowSize; // Trim buffer
  }
};

const startSync = () => {
  stopSync();
  syncTimer = setInterval(() => {
    if (tradeBuffer.length > 0) {
      recentTrades.value = [...tradeBuffer];
    }
  }, 500); // Sync to UI every 500ms
};

const stopSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
};

const buyVolume = computed(() => {
  return recentTrades.value
    .filter(t => !t.isSell)
    .reduce((sum, t) => sum + t.qty, 0);
});

const sellVolume = computed(() => {
  return recentTrades.value
    .filter(t => t.isSell)
    .reduce((sum, t) => sum + t.qty, 0);
});

const totalVolume = computed(() => {
  return buyVolume.value + sellVolume.value;
});

const buyRatio = computed(() => {
  if (totalVolume.value === 0) return 0.5;
  return buyVolume.value / totalVolume.value;
});

const sellRatio = computed(() => {
  return 1 - buyRatio.value;
});

const imbalancePercentage = computed(() => {
  const buyPct = Math.round(buyRatio.value * 100);
  const sellPct = Math.round(sellRatio.value * 100);
  return { buyPct, sellPct };
});

const imbalanceText = computed(() => {
  const { buyPct, sellPct } = imbalancePercentage.value;
  if (buyPct > 55) return `BUYING IMBALANCE (+${buyPct - 50}%)`;
  if (sellPct > 55) return `SELLING IMBALANCE (+${sellPct - 50}%)`;
  return 'BALANCED FLOW';
});

const imbalanceStatusColor = computed(() => {
  const { buyPct, sellPct } = imbalancePercentage.value;
  if (buyPct > 55) return 'text-green-500';
  if (sellPct > 55) return 'text-red-500';
  return 'text-amber-500';
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
  recentTrades.value = [];
  tradeBuffer = [];
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
  <div class="w-full h-full border border-[#222222] bg-[#000000] rounded p-2 flex flex-col font-mono text-[10px]">
    <div class="flex items-center justify-between border-b border-[#222222] pb-1 mb-2 font-bold text-white uppercase text-[9px] tracking-wider">
      <span>ORDER FLOW IMBALANCE</span>
      <span>WINDOW: 200 TRADES</span>
    </div>

    <div v-if="recentTrades.length < 5" class="flex-1 flex items-center justify-center text-center text-gray-500 text-[9px]">
      CALCULATING ORDER FLOW...
    </div>
    <div v-else class="flex-1 flex flex-col justify-around py-1">
      <!-- Ratio Split Gauge Bar -->
      <div>
        <div class="flex justify-between text-[9px] font-bold text-gray-400 mb-1">
          <span class="text-green-500">BUY: {{ imbalancePercentage.buyPct }}%</span>
          <span class="text-red-500">SELL: {{ imbalancePercentage.sellPct }}%</span>
        </div>
        <div class="w-full h-3 bg-[#111111] rounded overflow-hidden flex border border-[#222222]">
          <div 
            class="h-full bg-green-500 transition-all duration-300"
            :style="{ width: `${buyRatio * 100}%` }"
          ></div>
          <div 
            class="h-full bg-red-500 transition-all duration-300"
            :style="{ width: `${sellRatio * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Live Volume breakdown -->
      <div class="grid grid-cols-2 gap-2 text-[9px] border-t border-[#111111] pt-2 mt-1">
        <div>
          <span class="text-gray-500">BUY VOL:</span>
          <span class="text-green-500 font-bold ml-1">{{ buyVolume.toFixed(2) }}</span>
        </div>
        <div>
          <span class="text-gray-500">SELL VOL:</span>
          <span class="text-red-500 font-bold ml-1">{{ sellVolume.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Control / Imbalance Momentum status -->
      <div class="text-center font-bold uppercase tracking-wider text-[9px] pt-1" :class="imbalanceStatusColor">
        {{ imbalanceText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
