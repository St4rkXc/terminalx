<!-- src/components/highcharts/VolatilityGauge.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';
import * as Highcharts from 'highcharts';

const props = defineProps<{
  symbol: string;
}>();

const chartRef = ref<HTMLElement | null>(null);
let chart: Highcharts.Chart | null = null;
let currentSubscription: string | null = null;

const priceHistory: number[] = [];
const volatilityScore = ref(0);
let syncTimer: any = null;
const isLoading = ref(true);

const labelText = computed(() => {
  const score = volatilityScore.value;
  if (score < 15) return 'LOW';
  if (score < 45) return 'NORMAL';
  if (score < 75) return 'ELEVATED';
  return 'EXTREME';
});

const gaugeColor = computed(() => {
  const score = volatilityScore.value;
  if (score < 15) return '#3b82f6'; // Blue
  if (score < 45) return '#00ff66'; // Green
  if (score < 75) return '#f59e0b'; // Amber
  return '#ff3333'; // Red
});

const initChart = () => {
  if (!chartRef.value) return;

  const options: Highcharts.Options = {
    chart: {
      type: 'areaspline',
      backgroundColor: '#000000',
      style: {
        fontFamily: 'monospace, Courier New'
      },
      marginRight: 5,
      marginLeft: 30,
      marginTop: 15,
      marginBottom: 20
    },
    title: {
      text: undefined
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
          color: '#666666',
          fontSize: '8px'
        }
      }
    },
    yAxis: {
      min: 0,
      max: 100,
      gridLineColor: '#111111',
      lineColor: '#222222',
      title: {
        text: undefined
      },
      labels: {
        style: {
          color: '#666666',
          fontSize: '8px'
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
        return `<b>TIME:</b> ${Highcharts.dateFormat('%H:%M:%S', this.x as number)}<br/>` +
               `<b>VOL INDEX:</b> <span style="color: ${this.y && this.y >= 75 ? '#ff3333' : '#00ff66'}">${this.y?.toFixed(1)}</span>`;
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      areaspline: {
        lineWidth: 1,
        color: '#f59e0b',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(245, 158, 11, 0.15)'],
            [1, 'rgba(245, 158, 11, 0.0)']
          ]
        },
        marker: {
          enabled: false
        }
      }
    },
    series: [
      {
        type: 'areaspline',
        name: 'Volatility Index',
        data: []
      }
    ]
  };

  chart = Highcharts.chart(chartRef.value, options);
};

const handleTickerMessage = (data: any) => {
  if (!data || !data.c) return;
  isLoading.value = false;

  const price = parseFloat(data.c);
  priceHistory.push(price);
  if (priceHistory.length > 20) {
    priceHistory.shift();
  }

  if (priceHistory.length >= 5) {
    const mean = priceHistory.reduce((sum, p) => sum + p, 0) / priceHistory.length;
    const variance = priceHistory.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priceHistory.length;
    const stdDev = Math.sqrt(variance);
    const stdDevPct = (stdDev / mean) * 100;

    // Map stdDevPct to 0-100 scale (0.1% standard deviation as 100)
    const targetScore = Math.min(100, Math.max(0, (stdDevPct / 0.1) * 100));
    // Apply smoothing
    volatilityScore.value = volatilityScore.value * 0.7 + targetScore * 0.3;
  }
};

const startSync = () => {
  stopSync();
  syncTimer = setInterval(() => {
    if (!chart) return;
    const timestamp = Date.now();
    const series = chart.series[0];
    const shift = series.data.length >= 60; // Keep last 60 points (60 seconds)
    series.addPoint([timestamp, volatilityScore.value], true, shift);
  }, 1000);
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
  priceHistory.length = 0;
  volatilityScore.value = 0;
  if (chart) {
    chart.series[0].setData([]);
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
  <div class="w-full h-full border border-[#222222] bg-[#000000] rounded p-2 flex flex-col font-mono text-[10px]">
    <div class="flex items-center justify-between border-b border-[#222222] pb-1 mb-1 font-bold text-white uppercase text-[9px] tracking-wider">
      <span>VOLATILITY MONITOR</span>
      <span class="text-amber-500 uppercase">> 20s WINDOW</span>
    </div>
    
    <div class="flex-1 flex items-center justify-between gap-2 min-h-0">
      <!-- Left: Circular Gauge -->
      <div class="flex flex-col items-center justify-center p-1 w-[35%] flex-shrink-0">
        <div class="relative flex items-center justify-center" style="width: 128px; height: 128px; flex-shrink: 0;">
          <svg viewBox="0 0 100 100" style="width: 128px; height: 128px; flex-shrink: 0;">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#111111" stroke-width="8" />
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="none" 
              :stroke="gaugeColor" 
              stroke-width="8" 
              stroke-dasharray="251.2"
              :stroke-dashoffset="251.2 - (251.2 * volatilityScore) / 100"
              stroke-linecap="round"
              transform="rotate(-90 50 50)"
              class="transition-all duration-300 ease-out"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span class="text-[16px] font-bold text-white">{{ Math.round(volatilityScore) }}</span>
            <span class="text-[10px] font-semibold mt-1 tracking-wider uppercase" :style="{ color: gaugeColor }">
              {{ labelText }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Historical Chart -->
      <div class="flex-1 h-full min-h-0 relative">
        <div v-if="isLoading" class="absolute inset-0 bg-[#000000]/60 z-10 flex items-center justify-center text-gray-500 text-[8px]">
          WAITING FOR TICKER...
        </div>
        <div ref="chartRef" class="w-full h-full"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
