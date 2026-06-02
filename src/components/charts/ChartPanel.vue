<!-- src/components/charts/ChartPanel.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import { useSettingsStore } from '../../stores/settings';
import { useLightweightChart } from '../../composables/useLightweightChart';
import { fetchHistoricalKlines, ChartBar } from '../../composables/useBinanceKlines';
import { wsManager } from '../../composables/useWebSocketManager';
import { fetchWithRetry } from '../../utils/fetchRetry';
import { candleSeriesOptions, volumeSeriesOptions } from '../../utils/chartTheme';
import { Maximize2, Minimize2, Settings as SettingsIcon, X, BarChart2, GripVertical } from 'lucide-vue-next';
import ChartConfig from './ChartConfig.vue';
import { UTCTimestamp, CandlestickSeries, LineSeries, BarSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import { polygonQueue } from '../../utils/requestQueue';

const props = withDefaults(defineProps<{
  panelId: string;
  tabId: string;
  draggable?: boolean;
}>(), {
  draggable: false
});

const workspaceStore = useWorkspaceStore();
const settingsStore = useSettingsStore();

const tab = computed(() => workspaceStore.tabs.find((t) => t.id === props.tabId));
const assetMode = computed(() => tab.value?.assetMode || 'crypto');

// Find panel object from store
const panel = ref(
  workspaceStore.tabs
    .find((t) => t.id === props.tabId)!
    .panels.find((p) => p.id === props.panelId)!
);

// Track changes to panel definition in store
watch(
  () =>
    workspaceStore.tabs
      .find((t) => t.id === props.tabId)
      ?.panels.find((p) => p.id === props.panelId),
  (newVal) => {
    if (newVal) {
      panel.value = newVal;
    }
  },
  { deep: true }
);

const chartContainer = ref<HTMLElement | null>(null);
const { initChart, destroyChart, chartInstance } = useLightweightChart();

let mainSeries: any = null;
let volumeSeries: any = null;
let stockIntervalTimer: any = null;
let currentRequestId = 0;

const getFinnhubResolution = (interval: string): string => {
  switch (interval) {
    case '1m': return '1';
    case '5m': return '5';
    case '15m': return '15';
    case '30m': return '30';
    case '1h': return '60';
    case '4h': return 'D';
    case '1d': return 'D';
    case '1w': return 'W';
    default: return 'D';
  }
};

const getPolygonMultiplier = (interval: string): number => {
  const match = interval.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 1;
};

const getPolygonTimespan = (interval: string): string => {
  if (interval.endsWith('m')) return 'minute';
  if (interval.endsWith('h')) return 'hour';
  if (interval.endsWith('d')) return 'day';
  if (interval.endsWith('w')) return 'week';
  return 'day';
};

const getFromTimestamp = (resolution: string): number => {
  const now = Math.floor(Date.now() / 1000);
  switch (resolution) {
    case '1': return now - 2 * 24 * 60 * 60;
    case '5': return now - 5 * 24 * 60 * 60;
    case '15': return now - 15 * 24 * 60 * 60;
    case '30': return now - 30 * 24 * 60 * 60;
    case '60': return now - 45 * 24 * 60 * 60;
    case 'D': return now - 365 * 24 * 60 * 60;
    case 'W': return now - 5 * 365 * 24 * 60 * 60;
    default: return now - 365 * 24 * 60 * 60;
  }
};

const isLoading = ref(true);
const isWaitingForQueue = ref(false);
const isError = ref(false);
const isKeyMissing = ref(false);
const isPolygonKeyMissing = ref(false);
const isTierRestricted = ref(false);
const isUnsupportedSymbol = ref(false);
const showConfig = ref(false);
const isFullscreen = ref(false);
const lastPrice = ref<number | null>(null);
const priceChangePct = ref<number>(0);
const prevClose = ref<number | null>(null);

// WebSocket real-time subscription callback
const handleWsMessage = (data: any) => {
  if (!data || !data.k) return;
  const kline = data.k;
  const price = parseFloat(kline.c);
  lastPrice.value = price;
  
  if (prevClose.value) {
    priceChangePct.value = ((price - prevClose.value) / prevClose.value) * 100;
  }

  const bar: ChartBar = {
    time: (kline.t / 1000) as UTCTimestamp,
    open: parseFloat(kline.o),
    high: parseFloat(kline.h),
    low: parseFloat(kline.l),
    close: price,
    volume: parseFloat(kline.v),
  };

  if (mainSeries) {
    mainSeries.update(bar);
  }
  if (volumeSeries && panel.value.showVolume) {
    volumeSeries.update({
      time: bar.time,
      value: bar.volume || 0,
      color: bar.close >= bar.open ? settingsStore.accentColor + '80' : '#ff444480',
    });
  }
};

const setupChartFeed = async () => {
  if (!chartContainer.value) return;
  
  const requestId = ++currentRequestId;
  
  isLoading.value = true;
  isError.value = false;
  isKeyMissing.value = false;
  isPolygonKeyMissing.value = false;
  isWaitingForQueue.value = false;
  isTierRestricted.value = false;
  isUnsupportedSymbol.value = false;

  // Intercept missing API key in Stocks Mode
  if (assetMode.value === 'stocks') {
    if (!settingsStore.finnhubApiKey) {
      isKeyMissing.value = true;
      isLoading.value = false;
      return;
    }
    if (!settingsStore.polygonApiKey) {
      isPolygonKeyMissing.value = true;
      isLoading.value = false;
      return;
    }
  }

  try {
    // 1. Init lightweight charts
    const chart = initChart(chartContainer.value, settingsStore.accentColor);

    // 2. Create selected series type
    const accent = settingsStore.accentColor;
    if (panel.value.chartType === 'candlestick') {
      mainSeries = chart.addSeries(CandlestickSeries, candleSeriesOptions(accent));
    } else if (panel.value.chartType === 'line') {
      mainSeries = chart.addSeries(LineSeries, { color: accent, lineWidth: 2 });
    } else if (panel.value.chartType === 'bar') {
      mainSeries = chart.addSeries(BarSeries, { upColor: accent, downColor: '#ff4444' });
    } else if (panel.value.chartType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: accent + '30',
        bottomColor: 'transparent',
        lineColor: accent,
        lineWidth: 2,
      });
    }

    // 3. Create Volume Series if needed
    if (panel.value.showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, volumeSeriesOptions());
      
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    if (requestId !== currentRequestId) return;

    // 5. Load historical data depending on Asset Mode
    let history: ChartBar[] = [];
    
    if (assetMode.value === 'stocks') {
      isWaitingForQueue.value = true;
      
      await polygonQueue.add(async () => {
        if (requestId !== currentRequestId) return;
        isWaitingForQueue.value = false;
        const multiplier = getPolygonMultiplier(panel.value.interval);
        const timespan = getPolygonTimespan(panel.value.interval);
        const to = Math.floor(Date.now() / 1000) * 1000;
        const resolution = getFinnhubResolution(panel.value.interval);
        const from = getFromTimestamp(resolution) * 1000;
        
        const url = `https://api.polygon.io/v2/aggs/ticker/${panel.value.symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&apiKey=${settingsStore.polygonApiKey}`;
        const res = await fetchWithRetry(url);
        if (requestId !== currentRequestId) return;
        const data = await res.json();
        if (requestId !== currentRequestId) return;
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          history = data.results.map((r: any) => ({
            time: (r.t / 1000) as UTCTimestamp,
            open: r.o,
            high: r.h,
            low: r.l,
            close: r.c,
            volume: r.v,
          }));
        } else if (data.resultsCount === 0 || (data.status === 'OK' && (!data.results || data.results.length === 0))) {
          isUnsupportedSymbol.value = true;
          destroyChart();
          isLoading.value = false;
        } else {
          throw new Error(`Polygon returned status: ${data.status}`);
        }
      });

      if (requestId !== currentRequestId) return;

      if (isUnsupportedSymbol.value || !history.length) {
        isLoading.value = false;
        return;
      }
    } else {
      // Crypto Mode
      history = await fetchHistoricalKlines(panel.value.symbol, panel.value.interval);
      if (requestId !== currentRequestId) return;
    }

    if (history.length > 0) {
      const mainData = history.map((h) => ({
        time: h.time,
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
      }));
      mainSeries.setData(mainData);

      if (panel.value.showVolume && volumeSeries) {
        const volData = history.map((h) => ({
          time: h.time,
          value: h.volume || 0,
          color: h.close >= h.open ? accent + '80' : '#ff444480',
        }));
        volumeSeries.setData(volData);
      }

      // Track statistics
      const lastBar = history[history.length - 1];
      lastPrice.value = lastBar.close;
      prevClose.value = history[0].close;
      priceChangePct.value = ((lastBar.close - prevClose.value) / prevClose.value) * 100;
    }

    // 6. Connect real-time updates
    if (assetMode.value === 'stocks') {
      const fetchStockTick = async () => {
        if (requestId !== currentRequestId) return;
        if (!settingsStore.finnhubApiKey) return;
        try {
          const url = `https://finnhub.io/api/v1/quote?symbol=${panel.value.symbol}&token=${settingsStore.finnhubApiKey}`;
          const tickRes = await fetchWithRetry(url);
          if (requestId !== currentRequestId) return;
          const tickData = await tickRes.json();
          if (requestId !== currentRequestId) return;
          if (tickData.c) {
            const price = tickData.c;
            lastPrice.value = price;
            if (prevClose.value) {
              priceChangePct.value = ((price - prevClose.value) / prevClose.value) * 100;
            }
            if (mainSeries && history.length > 0) {
              const lastBar = history[history.length - 1];
              mainSeries.update({
                time: lastBar.time,
                open: lastBar.open,
                high: Math.max(lastBar.high, price),
                low: Math.min(lastBar.low, price),
                close: price,
              });
            }
          }
        } catch (err) {
          console.warn('[ChartPanel] Stock tick poll failed:', err);
        }
      };
      // Poll stock quote every 10 seconds for real-time tick updates
      stockIntervalTimer = setInterval(fetchStockTick, 10000);
    } else {
      // Crypto WebSocket
      const streamName = `${panel.value.symbol.toLowerCase()}@kline_${panel.value.interval}`;
      wsManager.subscribe(streamName, handleWsMessage);
    }

    isLoading.value = false;
  } catch (err: any) {
    if (requestId !== currentRequestId) return;
    console.error('[ChartPanel] Setup failed:', err);
    if (err.message?.includes('status: 403')) {
      isTierRestricted.value = true;
    } else {
      isError.value = true;
    }
    isLoading.value = false;
  }
};

const cleanupFeed = () => {
  if (stockIntervalTimer) {
    clearInterval(stockIntervalTimer);
    stockIntervalTimer = null;
  }
  if (assetMode.value === 'crypto') {
    const streamName = `${panel.value.symbol.toLowerCase()}@kline_${panel.value.interval}`;
    wsManager.unsubscribe(streamName, handleWsMessage);
  }
  destroyChart();
  mainSeries = null;
  volumeSeries = null;
};

const toggleVolume = () => {
  workspaceStore.updatePanel(props.tabId, props.panelId, {
    showVolume: !panel.value.showVolume,
  });
};

onMounted(() => {
  setupChartFeed();
});

onUnmounted(() => {
  cleanupFeed();
});

// Watch symbol/timeframe changes
watch(
  () => [
    panel.value.symbol,
    panel.value.interval,
    panel.value.chartType,
    panel.value.showVolume,
    assetMode.value,
    settingsStore.finnhubApiKey
  ],
  () => {
    cleanupFeed();
    setupChartFeed();
  }
);

watch(isFullscreen, () => {
  // Give LWC a tiny delay to capture resized size container
  setTimeout(() => {
    if (chartInstance.value && chartContainer.value) {
      chartInstance.value.resize(
        chartContainer.value.clientWidth,
        chartContainer.value.clientHeight
      );
    }
  }, 100);
});
</script>

<template>
  <div
    class="bg-panel border border-border flex flex-col font-mono relative overflow-hidden h-full w-full select-none"
    :class="isFullscreen ? 'fixed inset-0 z-40 bg-black h-screen w-screen' : ''"
  >
    <!-- Header -->
    <div class="h-8 border-b border-border flex items-center justify-between px-3 text-[10px] select-none bg-black">
      <div class="flex items-center space-x-2">
        <GripVertical
          v-if="props.draggable"
          class="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing mr-0.5 flex-shrink-0"
        />
        <button
          @click="showConfig = !showConfig"
          class="font-bold text-gray-300 hover:text-white flex items-center space-x-1"
        >
          <span class="text-accent-green">●</span>
          <span>{{ panel.symbol }}</span>
          <span class="text-gray-600 font-semibold">{{ panel.interval }}</span>
        </button>
      </div>

      <!-- Price details -->
      <div v-if="lastPrice !== null" class="flex items-center space-x-2 text-[10px] font-semibold">
        <span class="text-gray-400 font-medium">LAST:</span>
        <span class="text-white font-mono">{{ lastPrice.toFixed(2) }}</span>
        <span
          class="font-mono"
          :class="priceChangePct >= 0 ? 'text-accent-green' : 'text-accent-red'"
        >
          {{ priceChangePct >= 0 ? '+' : '' }}{{ priceChangePct.toFixed(2) }}%
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-1 text-gray-500">
        <button
          @click="toggleVolume"
          class="p-0.5 rounded hover:bg-surface hover:text-white transition-colors"
          title="Toggle Volume Subscale"
        >
          <BarChart2 class="h-3 w-3" :class="panel.showVolume ? 'text-accent-green' : ''" />
        </button>
        <button
          @click="showConfig = !showConfig"
          class="p-0.5 rounded hover:bg-surface hover:text-white transition-colors"
          title="Configure chart settings"
        >
          <SettingsIcon class="h-3 w-3" />
        </button>
        <button
          @click="isFullscreen = !isFullscreen"
          class="p-0.5 rounded hover:bg-surface hover:text-white transition-colors"
          title="Maximize panel"
        >
          <Maximize2 v-if="!isFullscreen" class="h-3 w-3" />
          <Minimize2 v-else class="h-3 w-3" />
        </button>
        <button
          v-if="!isFullscreen"
          @click="workspaceStore.removePanel(props.tabId, props.panelId)"
          class="p-0.5 rounded hover:bg-surface text-gray-600 hover:text-accent-red transition-colors"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Chart Canvas -->
    <div class="flex-1 w-full bg-black relative" ref="chartContainer">
      <!-- Key missing warning -->
      <div
        v-if="isKeyMissing"
        class="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center p-4 text-center space-y-2 text-[10px] text-gray-500"
      >
        <span>FINNHUB API KEY REQUIRED FOR STOCK CHART</span>
        <span class="text-[8px] text-gray-600">Please check your .env configuration</span>
      </div>

      <!-- Polygon Key missing warning -->
      <div
        v-if="isPolygonKeyMissing"
        class="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center p-4 text-center space-y-2 text-[10px] text-gray-500"
      >
        <span>POLYGON API KEY REQUIRED FOR HISTORICAL DATA</span>
        <span class="text-[8px] text-gray-600">Please check your .env configuration</span>
      </div>

      <!-- Tier restriction warning -->
      <div
        v-if="isTierRestricted"
        class="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center p-4 text-center space-y-2 text-[10px] text-accent-orange"
      >
        <span>FINNHUB TIER RESTRICTION (403)</span>
        <span class="text-[8px] text-gray-600">Historical stock data for this symbol is likely restricted on your plan.</span>
      </div>

      <!-- Unsupported symbol warning -->
      <div
        v-if="isUnsupportedSymbol"
        class="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center p-4 text-center space-y-2 text-[10px] text-accent-red"
      >
        <span>ASSET TICKER "{{ panel.symbol }}" NOT SUPPORTED OR NO DATA AVAILABLE</span>
        <span class="text-[8px] text-gray-600">Click symbol name in header to search for stock tickers</span>
      </div>

      <!-- Loading skeletal overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center space-y-2 text-gray-600 text-[10px]"
      >
        <div class="h-4 w-4 border-2 border-accent-green border-t-transparent rounded-full animate-spin"></div>
        <span>BUFFERING STREAM...</span>
      </div>

      <!-- Error state -->
      <div
        v-else-if="isError"
        class="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center space-y-2 text-[10px] text-accent-red"
      >
        <span>STREAM CONNECTION FAILED</span>
        <button
          @click="setupChartFeed"
          class="px-2.5 py-1 bg-surface hover:bg-panel border border-border text-gray-300 rounded font-semibold uppercase tracking-wider"
        >
          RETRY
        </button>
      </div>

      <!-- Config panel overlay -->
      <ChartConfig v-if="showConfig" :panel="panel" @close="showConfig = false" />
    </div>
  </div>
</template>
