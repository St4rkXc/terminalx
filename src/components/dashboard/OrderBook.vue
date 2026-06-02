<!-- src/components/dashboard/OrderBook.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { wsManager } from '../../composables/useWebSocketManager';
import { fetchWithRetry } from '../../utils/fetchRetry';

interface BookRow {
  price: number;
  amount: number;
  total: number;
}

const settings = useSettingsStore();

const bids = ref<BookRow[]>([]);
const asks = ref<BookRow[]>([]);
const spread = ref(0);
const spreadPct = ref(0);
const isLoading = ref(true);

const stockInput = ref(settings.stockOrderBookSymbol);

const currentSymbol = computed(() => {
  return settings.assetMode === 'stocks' ? settings.stockOrderBookSymbol : settings.orderBookSymbol;
});

const hasFinnhubKey = computed(() => !!settings.finnhubApiKey);

const updateStockSymbol = () => {
  const sym = stockInput.value.trim().toUpperCase();
  if (sym.length > 0) {
    settings.updateSettings({ stockOrderBookSymbol: sym });
  }
};

let pollInterval: any = null;
let simInterval: any = null;
const latestStockPrice = ref<number | null>(null);

const fetchStockQuote = async () => {
  if (!settings.finnhubApiKey) return;
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${currentSymbol.value}&token=${settings.finnhubApiKey}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    if (data.c) {
      latestStockPrice.value = data.c;
      if (bids.value.length === 0) {
        generateInitialOrderBook(data.c);
      }
    }
  } catch (err) {
    console.error('[OrderBook] Error loading stock quote:', err);
  }
};

const generateInitialOrderBook = (price: number) => {
  isLoading.value = false;
  const tickSize = price > 100 ? 0.05 : 0.01;
  
  // Generate asks (increasing)
  let askAccum = 0;
  const processedAsks: BookRow[] = [];
  for (let i = 1; i <= 15; i++) {
    const askPrice = price + i * tickSize;
    const amount = Math.random() * 500 + 10;
    askAccum += amount;
    processedAsks.push({ price: askPrice, amount, total: askAccum });
  }
  asks.value = processedAsks;

  // Generate bids (decreasing)
  let bidAccum = 0;
  const processedBids: BookRow[] = [];
  for (let i = 1; i <= 15; i++) {
    const bidPrice = price - i * tickSize;
    const amount = Math.random() * 500 + 10;
    bidAccum += amount;
    processedBids.push({ price: bidPrice, amount, total: bidAccum });
  }
  bids.value = processedBids;

  spread.value = asks.value[0].price - bids.value[0].price;
  spreadPct.value = (spread.value / asks.value[0].price) * 100;
};

const runSimulationTick = () => {
  if (bids.value.length === 0 || asks.value.length === 0) return;

  const centerPrice = latestStockPrice.value || bids.value[0].price;
  const tickSize = centerPrice > 100 ? 0.05 : 0.01;

  // Update asks
  let askAccum = 0;
  asks.value = asks.value.map((row, idx) => {
    const deltaAmt = (Math.random() - 0.5) * 50;
    const amount = Math.max(10, row.amount + deltaAmt);
    askAccum += amount;
    return {
      price: centerPrice + (idx + 1) * tickSize + (Math.random() - 0.5) * (tickSize * 0.1),
      amount,
      total: askAccum,
    };
  });

  // Update bids
  let bidAccum = 0;
  bids.value = bids.value.map((row, idx) => {
    const deltaAmt = (Math.random() - 0.5) * 50;
    const amount = Math.max(10, row.amount + deltaAmt);
    bidAccum += amount;
    return {
      price: centerPrice - (idx + 1) * tickSize + (Math.random() - 0.5) * (tickSize * 0.1),
      amount,
      total: bidAccum,
    };
  });

  spread.value = asks.value[0].price - bids.value[0].price;
  spreadPct.value = (spread.value / asks.value[0].price) * 100;
};

const handleDepthMessage = (data: any) => {
  if (!data || !data.bids || !data.asks) return;
  isLoading.value = false;

  let bidAccum = 0;
  bids.value = data.bids.slice(0, 15).map((b: [string, string]) => {
    const price = parseFloat(b[0]);
    const amount = parseFloat(b[1]);
    bidAccum += amount;
    return { price, amount, total: bidAccum };
  });

  let askAccum = 0;
  asks.value = data.asks.slice(0, 15).map((a: [string, string]) => {
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

const setupFeeds = () => {
  cleanupFeeds();
  bids.value = [];
  asks.value = [];
  isLoading.value = true;

  if (settings.assetMode === 'stocks') {
    stockInput.value = settings.stockOrderBookSymbol;
    if (settings.finnhubApiKey) {
      fetchStockQuote();
      pollInterval = setInterval(fetchStockQuote, 20000);
      simInterval = setInterval(runSimulationTick, 1500);
    } else {
      isLoading.value = false;
    }
  } else {
    const stream = `${currentSymbol.value.toLowerCase()}@depth20@100ms`;
    wsManager.subscribe(stream, handleDepthMessage);
  }
};

const cleanupFeeds = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
  if (settings.assetMode === 'crypto') {
    const stream = `${currentSymbol.value.toLowerCase()}@depth20@100ms`;
    wsManager.unsubscribe(stream, handleDepthMessage);
  }
};

onMounted(() => {
  setupFeeds();
});

onUnmounted(() => {
  cleanupFeeds();
});

watch(
  () => [settings.assetMode, currentSymbol.value, settings.finnhubApiKey],
  () => {
    setupFeeds();
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
      <span class="text-[10px] text-accent-green uppercase font-bold tracking-wider">
        ORDER DEPTH LADDER [{{ settings.assetMode.toUpperCase() }}]
      </span>
      <div class="flex items-center space-x-1.5 font-mono text-[9px] text-gray-500">
        <span class="font-bold text-gray-400">SYMBOL:</span>
        <input
          v-if="settings.assetMode === 'stocks'"
          v-model="stockInput"
          @blur="updateStockSymbol"
          @keydown.enter="updateStockSymbol"
          class="bg-surface border border-border rounded px-1.5 py-0.5 text-white w-14 font-mono font-bold uppercase focus:border-accent-green focus:outline-none"
        />
        <span v-else class="font-bold text-white uppercase">{{ currentSymbol }}</span>
      </div>
    </div>

    <!-- Panel Content -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
      <!-- Finnhub Key Warning -->
      <div
        v-if="settings.assetMode === 'stocks' && !hasFinnhubKey"
        class="absolute inset-0 bg-black/45 z-10 flex flex-col items-center justify-center p-4 text-center space-y-2 text-[10px] text-gray-500"
      >
        <span>FINNHUB API KEY REQUIRED FOR STOCK DEPTH</span>
        <span class="text-[8px] text-gray-600">Open Settings (gear icon top right) to input key</span>
      </div>

      <!-- Loading state -->
      <div v-else-if="isLoading" class="absolute inset-0 bg-black/40 z-10 flex items-center justify-center text-gray-500">
        {{ settings.assetMode === 'stocks' ? 'PREPARING BBO DEPTH...' : 'STREAMING ORDERBOOK...' }}
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
              {{ settings.assetMode === 'stocks' ? 'SIM SPREAD:' : 'SPREAD:' }}
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
