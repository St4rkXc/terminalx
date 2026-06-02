<!-- src/components/highcharts/DepthHeatmap.vue -->
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

let lastBids: [number, number][] = [];
let lastAsks: [number, number][] = [];
let syncTimer: any = null;
const isLoading = ref(true);

const initChart = () => {
  if (!chartRef.value) return;

  const options: Highcharts.Options = {
    chart: {
      type: 'area',
      backgroundColor: '#000000',
      style: {
        fontFamily: 'monospace, Courier New'
      },
      marginRight: 10,
      marginLeft: 55,
      marginTop: 25,
      marginBottom: 35
    },
    title: {
      text: 'DEPTH CHART (CUMULATIVE BIDS VS ASKS)',
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
        align: 'right',
        x: -5,
        style: {
          color: '#888888',
          fontSize: '9px'
        }
      }
    },
    tooltip: {
      backgroundColor: '#0a0a0a',
      borderColor: '#333333',
      style: {
        color: '#ffffff',
        fontSize: '9px',
        fontFamily: 'monospace'
      },
      formatter: function(): string {
        const seriesName = this.series.name;
        const color = seriesName === 'Bids' ? '#00ff66' : '#ff3333';
        return `<b>PRICE:</b> ${this.x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br/>` +
               `<b>CUM QTY:</b> <span style="color: ${color}">${this.y?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      area: {
        lineWidth: 1.5,
        marker: {
          enabled: false
        },
        step: 'center'
      }
    },
    series: [
      {
        type: 'area',
        name: 'Bids',
        color: '#00ff66',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(0, 255, 102, 0.25)'],
            [1, 'rgba(0, 255, 102, 0.0)']
          ]
        },
        data: []
      },
      {
        type: 'area',
        name: 'Asks',
        color: '#ff3333',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(255, 51, 51, 0.25)'],
            [1, 'rgba(255, 51, 51, 0.0)']
          ]
        },
        data: []
      }
    ]
  };

  chart = Highcharts.chart(chartRef.value, options);
};

const handleDepthMessage = (data: any) => {
  if (!data || !data.bids || !data.asks) return;
  isLoading.value = false;

  let bidAccum = 0;
  const rawBids = data.bids.map((b: [string, string]) => {
    const price = parseFloat(b[0]);
    const amount = parseFloat(b[1]);
    bidAccum += amount;
    return [price, bidAccum] as [number, number];
  });
  // Sort ascending by price for Highcharts
  lastBids = rawBids.sort((a: any, b: any) => a[0] - b[0]);

  let askAccum = 0;
  lastAsks = data.asks.map((a: [string, string]) => {
    const price = parseFloat(a[0]);
    const amount = parseFloat(a[1]);
    askAccum += amount;
    return [price, askAccum] as [number, number];
  });
};

const startSync = () => {
  stopSync();
  syncTimer = setInterval(() => {
    if (!chart) return;
    if (lastBids.length > 0 || lastAsks.length > 0) {
      chart.series[0].setData(lastBids, false);
      chart.series[1].setData(lastAsks, false);
      chart.redraw();
    }
  }, 500); // Throttled redraw every 500ms
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

  const streamName = `${props.symbol.toLowerCase()}@depth20@100ms`;
  currentSubscription = streamName;
  wsManager.subscribe(streamName, handleDepthMessage);
  startSync();
};

const unsubscribeFromWS = () => {
  stopSync();
  if (currentSubscription) {
    wsManager.unsubscribe(currentSubscription, handleDepthMessage);
    currentSubscription = null;
  }
};

watch(() => props.symbol, () => {
  lastBids = [];
  lastAsks = [];
  if (chart) {
    chart.series[0].setData([]);
    chart.series[1].setData([]);
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
      LOADING DEPTH CHART...
    </div>
    <div ref="chartRef" class="w-full h-full"></div>
  </div>
</template>

<style scoped>
</style>
