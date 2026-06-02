<!-- src/components/highcharts/CumulativeVolumeDelta.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';
import * as Highcharts from 'highcharts';

const props = defineProps<{
  symbol: string;
  assetMode?: string;
}>();

const chartRef = ref<HTMLElement | null>(null);
let chart: Highcharts.Chart | null = null;
let currentSubscription: string | null = null;

let runningDelta = 0;
let lastTickTime = 0;
const intervalMs = 1000; // Update chart every 1 second
let sampleTimer: any = null;

const initChart = () => {
  if (!chartRef.value) return;

  const options: Highcharts.Options = {
    chart: {
      type: 'areaspline',
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
      text: 'CUMULATIVE VOLUME DELTA (CVD)',
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
      type: 'datetime',
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
      },
      plotLines: [{
        value: 0,
        color: '#333333',
        width: 1,
        zIndex: 1
      }]
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
        const time = Highcharts.dateFormat('%H:%M:%S', this.x as number);
        const value = this.y as number;
        const color = value >= 0 ? '#00ff66' : '#ff3333';
        return `<b>TIME:</b> ${time}<br/>` +
               `<b>CVD:</b> <span style="color: ${color}">${value.toFixed(2)}</span>`;
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      areaspline: {
        threshold: 0,
        lineWidth: 1.5,
        color: '#00ff66', // color when positive
        negativeColor: '#ff3333', // color when negative
        fillOpacity: 0.15,
        marker: {
          enabled: false
        }
      }
    },
    series: [{
      type: 'areaspline',
      name: 'CVD',
      data: []
    }]
  };

  chart = Highcharts.chart(chartRef.value, options);
};

const handleTradeMessage = (data: any) => {
  const qty = parseFloat(data.q);
  const isMaker = data.m; // true = sell, false = buy

  if (isMaker) {
    runningDelta -= qty;
  } else {
    runningDelta += qty;
  }
};

const startSampling = () => {
  stopSampling();
  
  // Set initial point
  lastTickTime = Date.now();
  if (chart && chart.series[0]) {
    chart.series[0].addPoint([lastTickTime, runningDelta], true, false);
  }

  sampleTimer = setInterval(() => {
    if (!chart) return;

    const timestamp = Date.now();
    const series = chart.series[0];
    const shift = series.data.length >= 120; // 120 points = 2 minutes of 1s ticks

    series.addPoint([timestamp, runningDelta], true, shift);
  }, intervalMs);
};

const stopSampling = () => {
  if (sampleTimer) {
    clearInterval(sampleTimer);
    sampleTimer = null;
  }
};

const subscribeToWS = () => {
  unsubscribeFromWS();

  const streamName = `${props.symbol.toLowerCase()}@trade`;
  currentSubscription = streamName;
  wsManager.subscribe(streamName, handleTradeMessage);
  startSampling();
};

const unsubscribeFromWS = () => {
  stopSampling();
  if (currentSubscription) {
    wsManager.unsubscribe(currentSubscription, handleTradeMessage);
    currentSubscription = null;
  }
};

const resetCVD = () => {
  runningDelta = 0;
  if (chart && chart.series[0]) {
    chart.series[0].setData([]);
  }
};

watch(() => props.symbol, () => {
  resetCVD();
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
    <div ref="chartRef" class="w-full h-full"></div>
  </div>
</template>

<style scoped>
</style>
