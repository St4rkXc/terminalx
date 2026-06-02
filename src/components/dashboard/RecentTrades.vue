<!-- src/components/dashboard/RecentTrades.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';
import { useSettingsStore } from '../../stores/settings';
import { fetchWithRetry } from '../../utils/fetchRetry';
import { AssetMode, RecentTrade } from '../../types';

const props = defineProps<{
  symbol: string;
  assetMode: AssetMode;
}>();

const settings = useSettingsStore();
const trades = ref<RecentTrade[]>([]);
const isLoading = ref(true);

let pollInterval: any = null;
let simInterval: any = null;
const latestStockPrice = ref<number | null>(null);

const handleTradeMessage = (data: any) => {
  if (!data || data.e !== 'trade') return;
  isLoading.value = false;

  const newTrade: RecentTrade = {
    id: data.t,
    price: parseFloat(data.p),
    quantity: parseFloat(data.q),
    side: data.m ? 'sell' : 'buy',
    time: data.T,
  };

  trades.value.unshift(newTrade);
  if (trades.value.length > 30) {
    trades.value.pop();
  }
};

const fetchStockPrice = async () => {
  if (!settings.finnhubApiKey) return;
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${props.symbol}&token=${settings.finnhubApiKey}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    if (data.c) {
      latestStockPrice.value = data.c;
      isLoading.value = false;
    }
  } catch (err) {
    console.error('[RecentTrades] Stock quote poll failed:', err);
  }
};

const generateSimulatedTrade = () => {
  const basePrice = latestStockPrice.value || 150;
  // Jitter price slightly
  const jitter = (Math.random() - 0.5) * (basePrice * 0.001);
  const tradePrice = basePrice + jitter;
  const quantity = Math.floor(Math.random() * 200) + 1;
  const side = Math.random() > 0.5 ? ('buy' as const) : ('sell' as const);

  const mockTrade: RecentTrade = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    price: tradePrice,
    quantity,
    side,
    time: Date.now(),
  };

  trades.value.unshift(mockTrade);
  if (trades.value.length > 30) {
    trades.value.pop();
  }
};

const setupFeed = () => {
  cleanupFeed();
  trades.value = [];
  isLoading.value = true;

  if (props.assetMode === 'stocks') {
    fetchStockPrice();
    // Poll stock price for updates
    pollInterval = setInterval(fetchStockPrice, 20000);
    // Generate synthetic trades at a high frequency
    simInterval = setInterval(generateSimulatedTrade, 2000);
  } else {
    const stream = `${props.symbol.toLowerCase()}@trade`;
    wsManager.subscribe(stream, handleTradeMessage);
  }
};

const cleanupFeed = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
  if (props.assetMode === 'crypto') {
    const stream = `${props.symbol.toLowerCase()}@trade`;
    wsManager.unsubscribe(stream, handleTradeMessage);
  }
};

onMounted(() => {
  setupFeed();
});

onUnmounted(() => {
  cleanupFeed();
});

watch(
  () => [props.symbol, props.assetMode, settings.finnhubApiKey],
  () => {
    setupFeed();
  }
);

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
</script>

<template>
  <div class="h-full w-full bg-panel border border-border flex flex-col font-mono text-[10px] select-none text-gray-300">
    <!-- Header -->
    <div class="h-8 border-b border-border flex items-center justify-between px-3 bg-black">
      <span class="text-[10px] text-accent-green uppercase font-bold tracking-wider">
        LIVE ACTIVITY FEED
      </span>
      <span
        v-if="props.assetMode === 'stocks'"
        class="text-[8px] bg-surface text-accent-orange border border-border px-1 rounded font-bold uppercase tracking-wider"
      >
        SIMULATED
      </span>
    </div>

    <!-- Feed Content -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
      <div v-if="isLoading" class="absolute inset-0 bg-black/40 z-10 flex items-center justify-center text-gray-500">
        {{ props.assetMode === 'stocks' ? 'CONNECTING QUOTE FEED...' : 'WAITING FOR TRADES...' }}
      </div>

      <div v-else class="flex-1 flex flex-col overflow-hidden">
        <!-- Table Header -->
        <div class="grid grid-cols-4 px-3 py-1.5 border-b border-border bg-[#0a0a0a] text-gray-500 font-bold uppercase text-[8px]">
          <span>TIME</span>
          <span>SIDE</span>
          <span class="text-right">PRICE</span>
          <span class="text-right">SIZE</span>
        </div>

        <!-- Scrollable List -->
        <div class="flex-1 overflow-y-auto min-h-0 divide-y divide-border/20">
          <div
            v-for="trade in trades"
            :key="trade.id"
            class="grid grid-cols-4 px-3 py-1 items-center hover:bg-surface/20 transition-all"
          >
            <span class="text-gray-500">{{ formatTime(trade.time) }}</span>
            <span
              class="font-bold text-[9px]"
              :class="trade.side === 'buy' ? 'text-accent-green' : 'text-accent-red'"
            >
              {{ trade.side.toUpperCase() }}
            </span>
            <span class="text-right text-white font-semibold">
              {{ trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </span>
            <span class="text-right text-gray-400">
              {{ trade.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 }) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
