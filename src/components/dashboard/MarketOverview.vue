<!-- src/components/dashboard/MarketOverview.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { fetchWithRetry } from '../../utils/fetchRetry';
import { TrendingUp, TrendingDown } from 'lucide-vue-next';

interface TickerData {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
}

const settings = useSettingsStore();

const tickers = ref<TickerData[]>([]);
const isLoading = ref(true);
const isError = ref(false);
let timer: any = null;

const cryptoSymbols = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'DOGEUSDT',
  'DOTUSDT',
  'LINKUSDT',
];

const stockSymbols = [
  'AAPL',
  'MSFT',
  'TSLA',
  'NVDA',
  'AMZN',
  'GOOGL',
  'META',
  'NFLX',
  'SPY',
  'QQQ',
];

const hasFinnhubKey = computed(() => !!settings.finnhubApiKey);

const fetchTickers = async () => {
  isError.value = false;
  
  if (settings.assetMode === 'stocks') {
    if (!hasFinnhubKey.value) {
      tickers.value = [];
      isLoading.value = false;
      return;
    }
    
    try {
      // Fetch each stock quote in parallel
      const quotes = await Promise.all(
        stockSymbols.map(async (symbol) => {
          const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${settings.finnhubApiKey}`;
          const res = await fetchWithRetry(url);
          const data = await res.json();
          return {
            symbol,
            lastPrice: data.c ? data.c.toString() : '0',
            priceChangePercent: data.dp ? data.dp.toString() : '0',
            volume: '—', // Finnhub quote does not return volume on free tier
          };
        })
      );
      tickers.value = quotes;
      isLoading.value = false;
    } catch (err) {
      console.error('[MarketOverview] Error loading stock quotes:', err);
      isError.value = true;
      isLoading.value = false;
    }
  } else {
    // Crypto mode
    try {
      const symbolsParam = JSON.stringify(cryptoSymbols);
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`;
      const response = await fetchWithRetry(url);
      const data = await response.json();
      tickers.value = data.map((item: any) => ({
        symbol: item.symbol,
        lastPrice: item.lastPrice,
        priceChangePercent: item.priceChangePercent,
        volume: item.volume,
      }));
      isLoading.value = false;
    } catch (err) {
      console.error('[MarketOverview] Error loading crypto tickers:', err);
      isError.value = true;
      isLoading.value = false;
    }
  }
};

const setupTimer = () => {
  if (timer) clearInterval(timer);
  // Original polling rates: 20s for Stocks, 5s for Crypto
  const interval = settings.assetMode === 'stocks' ? 20000 : 5000;
  timer = setInterval(fetchTickers, interval);
};

onMounted(() => {
  fetchTickers();
  setupTimer();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// Watch mode changes to immediately reload
watch(
  () => [settings.assetMode, settings.finnhubApiKey],
  () => {
    isLoading.value = true;
    fetchTickers();
    setupTimer();
  }
);

const formatVol = (volStr: string) => {
  if (volStr === '—') return '—';
  const vol = parseFloat(volStr);
  if (isNaN(vol)) return '—';
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
  return vol.toLocaleString(undefined, { maximumFractionDigits: 0 });
};
</script>

<template>
  <div class="h-full w-full bg-panel border border-border flex flex-col font-mono text-xs select-none">
    <!-- Panel Header -->
    <div class="h-8 border-b border-border flex items-center justify-between px-3 bg-black">
      <span class="text-[10px] text-accent-green uppercase font-bold tracking-wider">
        MARKET MONITOR [{{ settings.assetMode.toUpperCase() }}]
      </span>
      <span class="text-[9px] text-gray-600">
        POLL: {{ settings.assetMode === 'stocks' ? '20s' : '5s' }}
      </span>
    </div>

    <!-- Panel Content -->
    <div class="flex-1 overflow-y-auto relative">
      <!-- Finnhub Key Missing Warning in Stock Mode -->
      <div
        v-if="settings.assetMode === 'stocks' && !hasFinnhubKey"
        class="absolute inset-0 bg-black/45 flex flex-col items-center justify-center p-4 text-center space-y-2 text-[10px] text-gray-500"
      >
        <span>FINNHUB API KEY REQUIRED FOR STOCK PRICES</span>
        <span class="text-[8px] text-gray-600">Please check your .env configuration</span>
      </div>

      <!-- Loading -->
      <div v-else-if="isLoading" class="absolute inset-0 bg-black/40 flex items-center justify-center text-gray-500 text-[10px]">
        LOADING MARKETS...
      </div>

      <!-- Error -->
      <div v-else-if="isError" class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-2 text-accent-red text-[10px]">
        <span>ERROR DOWNLOADING MARKETS</span>
        <button @click="fetchTickers" class="px-2 py-1 bg-surface border border-border text-gray-300 rounded hover:bg-panel">
          RETRY
        </button>
      </div>

      <!-- Data Table -->
      <table v-else class="w-full text-[10px] text-left border-collapse">
        <thead>
          <tr class="text-gray-500 border-b border-border/50 uppercase text-[9px] tracking-wider select-none bg-black">
            <th class="py-2 px-3 font-semibold">Asset</th>
            <th class="py-2 px-3 font-semibold text-right">Price</th>
            <th class="py-2 px-3 font-semibold text-right">24H Chg</th>
            <th class="py-2 px-3 font-semibold text-right">24H Vol</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ticker in tickers"
            :key="ticker.symbol"
            class="border-b border-border/20 hover:bg-surface/30 transition-colors"
          >
            <!-- Asset -->
            <td class="py-2 px-3 font-bold text-gray-300">
              <template v-if="settings.assetMode === 'crypto'">
                {{ ticker.symbol.replace('USDT', '') }}
                <span class="text-gray-600 text-[8px] font-medium">/USDT</span>
              </template>
              <template v-else>
                {{ ticker.symbol }}
              </template>
            </td>
            
            <!-- Price -->
            <td class="py-2 px-3 text-right font-mono text-white">
              {{ parseFloat(ticker.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </td>

            <!-- Change -->
            <td
              class="py-2 px-3 text-right font-mono font-bold flex items-center justify-end space-x-1"
              :class="parseFloat(ticker.priceChangePercent) >= 0 ? 'text-accent-green' : 'text-accent-red'"
            >
              <TrendingUp v-if="parseFloat(ticker.priceChangePercent) >= 0" class="h-2.5 w-2.5" />
              <TrendingDown v-else class="h-2.5 w-2.5" />
              <span>{{ parseFloat(ticker.priceChangePercent).toFixed(2) }}%</span>
            </td>

            <!-- Volume -->
            <td class="py-2 px-3 text-right font-mono text-gray-400">
              {{ formatVol(ticker.volume) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
