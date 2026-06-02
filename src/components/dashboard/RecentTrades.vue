<!-- src/components/dashboard/RecentTrades.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';
import { RecentTrade } from '../../types';

const props = defineProps<{
  symbol: string;
  assetMode?: string;
}>();

const trades = ref<RecentTrade[]>([]);
const isLoading = ref(true);

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

const setupFeed = () => {
  cleanupFeed();
  trades.value = [];
  isLoading.value = true;

  const stream = `${props.symbol.toLowerCase()}@trade`;
  wsManager.subscribe(stream, handleTradeMessage);
};

const cleanupFeed = () => {
  const stream = `${props.symbol.toLowerCase()}@trade`;
  wsManager.unsubscribe(stream, handleTradeMessage);
};

onMounted(() => {
  setupFeed();
});

onUnmounted(() => {
  cleanupFeed();
});

watch(
  () => props.symbol,
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
    </div>

    <!-- Feed Content -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
      <div v-if="isLoading" class="absolute inset-0 bg-black/40 z-10 flex items-center justify-center text-gray-500">
        WAITING FOR TRADES...
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
