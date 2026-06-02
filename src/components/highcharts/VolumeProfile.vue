<!-- src/components/highcharts/VolumeProfile.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';
import * as Highcharts from 'highcharts';

const props = defineProps<{
  symbol: string;
}>();

const chartRef = ref<HTMLElement | null>(null);
let chart: Highcharts.Chart | null = null;
let currentSubscription: string | null = null;

const bins = new Map<number, { buy: number; sell: number }>();
let currentPrice = 0;
let syncTimer: any = null;
const isLoading = ref(true);

const getBinSize = (price: number) => {
  if (price > 10000) return 10;
  if (price > 1000) return 1;
  if (price > 100) return 0.5;
  if (price > 10) return 0.1;
  if (price > 1) return 0.01;
  return 0.001;
};

const formatPrice = (price: number) => {
  if (price >= 1000) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  if (price >= 1) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
};

const initChart = () => {
  if (!chartRef.value) return;

  const options: Highcharts.Options = {
    chart: {
      type: 'bar',
      backgroundColor: '#000000',
      style: {
        fontFamily: 'monospace, Courier New'
      },
      marginRight: 10,
      marginLeft: 65,
      marginTop: 25,
      marginBottom: 30
    },
    title: {
      text: 'LIVE VOLUME PROFILE (DELTA STACKED)',
      align: 'left',
      style: {
        color: '#ffffff',
        fontSize: '10px',
        fontWeight: 'bold'
      }
    },
    credits: {
      enabled: false
    },
    xAxis: {
      categories: [],
      gridLineColor: '#111111',
      gridLineWidth: 1,
      lineColor: '#222222',
      tickColor: '#222222',
      labels: {
        style: {
          color: '#888888',
          fontSize: '9px'
        }
      }
    },
    yAxis: {
      gridLineColor: '#111111',
      lineColor: '#222222',
      title: {
        text: undefined
      },
      labels: {
        style: {
          color: '#888888',
          fontSize: '9px'
        }
      }
    },
    tooltip: {
      backgroundColor: '#0a0a0a',
      borderColor: '#333333',
      shared: true,
      style: {
        color: '#ffffff',
        fontSize: '9px',
        fontFamily: 'monospace'
      },
      formatter: function(): string {
        const points = this.points || [];
        let html = `<b>PRICE:</b> ${this.x}<br/>`;
        let total = 0;
        points.forEach(p => {
          const color = p.series.name === 'Buy Vol' ? '#00ff66' : '#ff3333';
          html += `<b>${p.series.name}:</b> <span style="color: ${color}">${p.y?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><br/>`;
          total += (p.y as number);
        });
        html += `<b>TOTAL VOL:</b> ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return html;
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      bar: {
        stacking: 'normal',
        borderWidth: 0,
        groupPadding: 0.05,
        pointPadding: 0.05
      }
    },
    series: [
      {
        type: 'bar',
        name: 'Buy Vol',
        color: '#00ff66',
        data: []
      },
      {
        type: 'bar',
        name: 'Sell Vol',
        color: '#ff3333',
        data: []
      }
    ]
  };

  chart = Highcharts.chart(chartRef.value, options);
};

const handleTradeMessage = (data: any) => {
  if (!data || !data.p || !data.q) return;
  isLoading.value = false;

  const price = parseFloat(data.p);
  const qty = parseFloat(data.q);
  const isMaker = data.m; // true = sell, false = buy
  currentPrice = price;

  const binSize = getBinSize(price);
  const bin = Math.round(price / binSize) * binSize;

  let entry = bins.get(bin);
  if (!entry) {
    entry = { buy: 0, sell: 0 };
    bins.set(bin, entry);
  }
  if (isMaker) {
    entry.sell += qty;
  } else {
    entry.buy += qty;
  }
};

const startSync = () => {
  stopSync();
  syncTimer = setInterval(() => {
    if (!chart) return;

    const allKeys = Array.from(bins.keys()).sort((a, b) => a - b);
    if (allKeys.length === 0) return;

    let keysToShow = [...allKeys];
    if (keysToShow.length > 20) {
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < keysToShow.length; i++) {
        const diff = Math.abs(keysToShow[i] - currentPrice);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      let start = Math.max(0, closestIdx - 10);
      let end = Math.min(keysToShow.length, start + 20);
      if (end - start < 20) {
        start = Math.max(0, end - 20);
      }
      keysToShow = keysToShow.slice(start, end);
    }

    const categories = keysToShow.map(k => formatPrice(k));
    const buyData = keysToShow.map(k => bins.get(k)!.buy);
    const sellData = keysToShow.map(k => bins.get(k)!.sell);

    chart.xAxis[0].setCategories(categories, false);
    chart.series[0].setData(buyData, false);
    chart.series[1].setData(sellData, false);
    chart.redraw();
  }, 500);
};

const stopSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
};

const subscribeToWS = () => {
  unsubscribeFromWS();
  isLoading.value = true;

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
  bins.clear();
  currentPrice = 0;
  if (chart) {
    chart.xAxis[0].setCategories([], false);
    chart.series[0].setData([], false);
    chart.series[1].setData([], false);
    chart.redraw();
  }
  subscribeToWS();
});

onMounted(() => {
  initChart();
  subscribeToWS();
});

onUnmounted(() => {
  unsubscribeFromWS();
  if (chart) {
    chart.destroy();
    chart = null;
  }
});
</script>

<template>
  <div class="w-full h-full relative border border-[#222222] bg-[#000000] rounded">
    <div v-if="isLoading" class="absolute inset-0 bg-[#000000]/60 z-10 flex items-center justify-center font-mono text-[9px] text-gray-500">
      STREAMING TRADE DATA FOR VOLUME PROFILE...
    </div>
    <div ref="chartRef" class="w-full h-full"></div>
  </div>
</template>

<style scoped>
</style>
