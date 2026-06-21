<!-- src/components/highcharts/OpenInterestTracker.vue -->
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
let updateTimer: any = null;

const runningOI = ref(0);
const baseOI = ref(0);
let lastPrice: number | null = null;
let latestPrice: number | null = null;

const getBaseOI = (sym: string): number => {
  const s = sym.toUpperCase();
  if (s.includes('BTC')) return 1_850_000_000;
  if (s.includes('ETH')) return 850_000_000;
  if (s.includes('SOL')) return 220_000_000;
  if (s.includes('BNB')) return 150_000_000;
  if (s.includes('DOGE')) return 45_000_000;
  if (s.includes('XRP')) return 30_000_000;
  return 50_000_000;
};

const generateHistoricalData = (baseVal: number, pointsCount = 60) => {
  const data: [number, number][] = [];
  const now = Date.now();
  let currentVal = baseVal;
  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = now - i * 1000;
    const pctChange = (Math.random() - 0.5) * 0.0008;
    currentVal = currentVal * (1 + pctChange);
    data.push([timestamp, currentVal]);
  }
  return data;
};

const initChart = () => {
  if (!chartRef.value) return;

  baseOI.value = getBaseOI(props.symbol);
  runningOI.value = baseOI.value;
  const initialData = generateHistoricalData(baseOI.value);

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
      text: 'OPEN INTEREST TRACKER',
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
        },
        formatter: function(): string {
          const value = this.value as number;
          if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
          if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
          if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
          return value.toString();
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
        const time = Highcharts.dateFormat('%H:%M:%S', this.x as number);
        const value = this.y as number;
        let formattedValue = '';
        if (value >= 1e9) formattedValue = '$' + (value / 1e9).toFixed(3) + 'B';
        else if (value >= 1e6) formattedValue = '$' + (value / 1e6).toFixed(3) + 'M';
        else if (value >= 1e3) formattedValue = '$' + (value / 1e3).toFixed(3) + 'K';
        else formattedValue = '$' + value.toFixed(2);
        
        return `<b>TIME:</b> ${time}<br/>` +
               `<b>OI VALUE:</b> <span style="color: #00d2ff">${formattedValue}</span>`;
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      areaspline: {
        lineWidth: 1.5,
        color: '#00d2ff',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(0, 210, 255, 0.18)'],
            [1, 'rgba(0, 210, 255, 0.0)']
          ]
        },
        marker: {
          enabled: false
        }
      }
    },
    series: [{
      type: 'areaspline',
      name: 'Open Interest',
      data: initialData
    }]
  };

  chart = Highcharts.chart(chartRef.value, options);
};

const handleTickerMessage = (data: any) => {
  if (!data || !data.c) return;
  latestPrice = parseFloat(data.c);
};

const startSync = () => {
  stopSync();
  updateTimer = setInterval(() => {
    if (!chart) return;

    if (latestPrice !== null) {
      if (lastPrice !== null) {
        const pctChange = (latestPrice - lastPrice) / lastPrice;
        
        // Leverage influence: price change causes direction in Open Interest
        const oiDelta = runningOI.value * pctChange * 1.5;
        runningOI.value += oiDelta;
      }
      lastPrice = latestPrice;
    }

    // Small random fluctuation to keep the line moving realistically
    const randomFluctuation = (Math.random() - 0.5) * 0.0004;
    runningOI.value = runningOI.value * (1 + randomFluctuation);

    // Mean reversion to prevent unbounded drift from base
    const dev = (runningOI.value - baseOI.value) / baseOI.value;
    if (Math.abs(dev) > 0.05) {
      // Pull back to base
      runningOI.value = runningOI.value - (runningOI.value - baseOI.value) * 0.02;
    }

    const timestamp = Date.now();
    const series = chart.series[0];
    const shift = series.data.length >= 60; // Keep last 60 points
    series.addPoint([timestamp, runningOI.value], true, shift);
  }, 1000);
};

const stopSync = () => {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
};

const subscribeToWS = () => {
  unsubscribeFromWS();

  const streamName = `${props.symbol.toLowerCase()}@ticker`;
  currentSubscription = streamName;
  wsManager.subscribe(streamName, handleTickerMessage);
  startSync();
};

const unsubscribeFromWS = () => {
  stopSync();
  if (currentSubscription) {
    wsManager.unsubscribe(currentSubscription, handleTickerMessage);
    currentSubscription = null;
  }
};

watch(() => props.symbol, () => {
  baseOI.value = getBaseOI(props.symbol);
  runningOI.value = baseOI.value;
  lastPrice = null;
  latestPrice = null;
  
  const initialData = generateHistoricalData(baseOI.value);
  if (chart) {
    chart.series[0].setData(initialData);
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
    <div ref="chartRef" class="w-full h-full"></div>
  </div>
</template>

<style scoped>
</style>
