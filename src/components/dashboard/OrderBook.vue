<!-- src/components/dashboard/OrderBook.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';

// Track the stream name we are actually subscribed to so cleanup
// always unsubscribes the correct stream regardless of later prop changes.
let activeStream: string | null = null;
// Debounce timer for the symbol watcher
let setupDebounce: ReturnType<typeof setTimeout> | null = null;

interface BookRow {
  price: number;
  amount: number;
  total: number;
}

const props = withDefaults(
  defineProps<{
    symbol: string;
    compact?: boolean;
    allowModeSwitch?: boolean;
    assetMode?: string;
  }>(),
  {
    compact: false,
    allowModeSwitch: false,
  }
);

const bids = ref<BookRow[]>([]);
const asks = ref<BookRow[]>([]);
const spread = ref(0);
const spreadPct = ref(0);
const isLoading = ref(true);

const activeSymbol = ref(props.symbol);

// Keep local active symbol in sync when props update
watch(
  () => props.symbol,
  (newSym) => {
    activeSymbol.value = newSym;
  }
);

const currentSymbol = computed(() => {
  return activeSymbol.value;
});

const maxRows = computed(() => (props.compact ? 8 : 15));

const handleDepthMessage = (data: any) => {
  if (!data || !data.bids || !data.asks) return;
  isLoading.value = false;

  let bidAccum = 0;
  bids.value = data.bids.slice(0, maxRows.value).map((b: [string, string]) => {
    const price = parseFloat(b[0]);
    const amount = parseFloat(b[1]);
    bidAccum += amount;
    return { price, amount, total: bidAccum };
  });

  let askAccum = 0;
  asks.value = data.asks.slice(0, maxRows.value).map((a: [string, string]) => {
    const price = parseFloat(a[0]);
    const amount = parseFloat(a[1]);
    askAccum += amount;
    return { price, amount, total: askAccum };
  });

  if (asks.value.length > 0 && bids.value.length > 0) {
    spread.value = asks.value[0].price - bids.value[0].price;
    spreadPct.value = (spread.value / asks.value[0].price) * 100;
  }
};

const cleanupFeeds = () => {
  if (activeStream) {
    wsManager.unsubscribe(activeStream, handleDepthMessage);
    activeStream = null;
  }
};

const setupFeeds = () => {
  cleanupFeeds();
  isLoading.value = bids.value.length === 0 && asks.value.length === 0;

  const stream = `${currentSymbol.value.toLowerCase()}@depth20@100ms`;
  activeStream = stream;
  wsManager.subscribe(stream, handleDepthMessage);
};

onMounted(() => {
  setupFeeds();
});

onUnmounted(() => {
  if (setupDebounce) clearTimeout(setupDebounce);
  cleanupFeeds();
});

// Debounced watcher — absorbs rapid tab-switch changes so we only rebuild once per gesture.
watch(
  () => currentSymbol.value,
  () => {
    if (setupDebounce) clearTimeout(setupDebounce);
    setupDebounce = setTimeout(() => {
      setupDebounce = null;
      setupFeeds();
    }, 120);
  }
);

const maxTotal = computed(() => {
  const maxBidTotal = bids.value.length > 0 ? bids.value[bids.value.length - 1].total : 0;
  const maxAskTotal = asks.value.length > 0 ? asks.value[asks.value.length - 1].total : 0;
  return Math.max(maxBidTotal, maxAskTotal, 1);
});
</script>

<template>
  <div class="h-full w-full bg-panel border border-border flex flex-col font-mono text-[10px] select-none text-gray-300">
    <!-- Panel Header -->
    <div class="h-8 border-b border-border flex items-center justify-between px-3 bg-black">
      <div class="flex items-center space-x-2">
        <span class="text-[10px] text-accent-green uppercase font-bold tracking-wider mr-2">
          ORDER DEPTH LADDER
        </span>
        <span class="text-[8px] text-gray-500 font-bold uppercase tracking-wider">
          [CRYPTO]
        </span>
      </div>
      <div class="flex items-center space-x-1.5 font-mono text-[9px] text-gray-500">
        <span class="font-bold text-gray-400">SYMBOL:</span>
        <span class="font-bold text-white uppercase">{{ currentSymbol }}</span>
      </div>
    </div>

    <!-- Panel Content -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
      <!-- Loading state -->
      <div v-if="isLoading" class="absolute inset-0 bg-black/40 z-10 flex items-center justify-center text-gray-500">
        STREAMING ORDERBOOK...
      </div>

      <div v-else class="flex-1 flex flex-col overflow-y-auto px-1">
        <!-- Asks List (Red, rendered in reverse order so the lowest ask is closest to spread) -->
        <div class="flex flex-col-reverse justify-end flex-1 min-h-0">
          <div
            v-for="ask in asks"
            :key="ask.price"
            class="relative flex items-center justify-between h-4 px-2 hover:bg-surface/30 cursor-pointer"
          >
            <!-- Depth visual bar -->
            <div
              class="absolute right-0 top-0 bottom-0 bg-accent-red/10 transition-all duration-100"
              :style="{ width: `${(ask.total / maxTotal) * 100}%` }"
            ></div>
            
            <span class="text-accent-red font-bold z-10 font-mono">{{ ask.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
            <span class="text-white z-10 font-mono">{{ ask.amount.toFixed(2) }}</span>
            <span class="text-gray-500 z-10 font-mono">{{ ask.total.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</span>
          </div>
        </div>

        <!-- Spread row -->
        <div class="h-6 border-y border-border bg-black flex items-center justify-between px-2 font-mono font-bold select-none py-1">
          <div class="flex items-center space-x-2">
            <span class="text-[9px] text-gray-500 font-semibold uppercase">
              SPREAD:
            </span>
            <span class="text-white">{{ spread.toFixed(2) }}</span>
          </div>
          <span class="text-accent-orange">{{ spreadPct.toFixed(4) }}%</span>
        </div>

        <!-- Bids List (Green, highest bid at the top) -->
        <div class="flex flex-col flex-1 min-h-0">
          <div
            v-for="bid in bids"
            :key="bid.price"
            class="relative flex items-center justify-between h-4 px-2 hover:bg-surface/30 cursor-pointer"
          >
            <!-- Depth visual bar -->
            <div
              class="absolute right-0 top-0 bottom-0 bg-accent-green/10 transition-all duration-100"
              :style="{ width: `${(bid.total / maxTotal) * 100}%` }"
            ></div>

            <span class="text-accent-green font-bold z-10 font-mono">{{ bid.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
            <span class="text-white z-10 font-mono">{{ bid.amount.toFixed(2) }}</span>
            <span class="text-gray-500 z-10 font-mono">{{ bid.total.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
