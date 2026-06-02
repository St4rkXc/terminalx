<!-- src/components/highcharts/MarketSpeedMeter.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';
import * as Highcharts from 'highcharts';

const props = defineProps<{
  symbol: string;
  assetMode: 'crypto' | 'stocks';
}>();

const chartRef = ref<HTMLElement | null>(null);
let chart: Highcharts.Chart | null = null;
let currentSubscription: string | null = null;

let tradeCounter = 0;
let volumeCounter = 0;
let speedTimer: any = null;
const intervalMs = 1000; // Sample every 1 second

const initChart = () => {
  if (!chartRef.value) return;

  chart = Highcharts.chart(chartRef.value, {
    chart: {
      type: 'spline',
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
      text: 'MARKET SPEED (TRADES & VOL VELOCITY / SEC)',
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
    yAxis: [{
      // Left Axis: Trades/Sec
      gridLineColor: '#111111',
      lineColor: '#222222',
      title: {
        text: 'Trades/s',
        style: {
          color: '#00ffff',
          fontSize: '9px'
        }
      },
      labels: {
        align: 'right',
        x: -5,
        style: {
          color: '#00ffff',
          fontSize: '9px'
        }
      },
      min: 0
    }, {
      // Right Axis: Vol/Sec
      gridLineWidth: 0,
      lineColor: '#222222',
      title: {
        text: 'Volume/s',
        style: {
          color: '#ffff33',
          fontSize: '9px'
        }
      },
      labels: {
        align: 'left',
        x: 5,
        style: {
          color: '#ffff33',
          fontSize: '9px'
        }
      },
      opposite: true,
      min: 0
    }],
    tooltip: {
      shared: true,
      backgroundColor: '#0a0a0a',
      borderColor: '#333333',
      style: {
        color: '#ffffff',
        fontSize: '9px',
        fontFamily: 'monospace'
      }
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: '#888888',
        fontSize: '8px',
        fontFamily: 'monospace'
      },
      itemHoverStyle: {
        color: '#ffffff'
      },
      backgroundColor: 'transparent',
      borderWidth: 0,
      align: 'right',
      verticalAlign: 'top',
      layout: 'horizontal',
      x: 0,
      y: -10
    },
    plotOptions: {
      spline: {
        lineWidth: 1.5,
        marker: {
          enabled: false
        }
      }
    },
    series: [{
      type: 'spline',
      name: 'Trades/Sec',
      color: '#00ffff',
      yAxis: 0,
      data: []
    }, {
      type: 'spline',
      name: 'Volume/Sec',
      color: '#ffff33',
      yAxis: 1,
      data: []
    }]
  });
};

const handleTradeMessage = (data: any) => {
  if (props.assetMode !== 'crypto') return;

  tradeCounter++;
  volumeCounter += parseFloat(data.q);
};

const startSampling = () => {
  stopSampling();

  speedTimer = setInterval(() => {
    if (!chart || props.assetMode !== 'crypto') return;

    const timestamp = Date.now();
    const shift = chart.series[0].data.length >= 60; // 60 points = 1 minute history

    chart.series[0].addPoint([timestamp, tradeCounter], false, shift);
    chart.series[1].addPoint([timestamp, volumeCounter], false, shift);
    
    chart.redraw();

    // Reset counters for the next second
    tradeCounter = 0;
    volumeCounter = 0;
  }, intervalMs);
};

const stopSampling = () => {
  if (speedTimer) {
    clearInterval(speedTimer);
    speedTimer = null;
  }
};

const subscribeToWS = () => {
  unsubscribeFromWS();

  if (props.assetMode !== 'crypto') return;

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

const resetMeter = () => {
  tradeCounter = 0;
  volumeCounter = 0;
  if (chart) {
    chart.series[0].setData([]);
    chart.series[1].setData([]);
  }
};

watch(() => props.symbol, () => {
  resetMeter();
  subscribeToWS();
});

watch(() => props.assetMode, () => {
  resetMeter();
  if (props.assetMode === 'crypto') {
    subscribeToWS();
  } else {
    unsubscribeFromWS();
  }
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
    <div v-show="props.assetMode === 'crypto'" ref="chartRef" class="w-full h-full"></div>
    
    <!-- Crypto only fallback overlay -->
    <div v-if="props.assetMode !== 'crypto'" class="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 border border-[#333333] text-center z-10 font-mono">
      <span class="text-amber-500 font-bold text-xs tracking-wider mb-2">CRYPTO ONLY SPECIFICATION</span>
      <span class="text-[#888888] text-[9px]">REAL-TIME MARKET SPEED ANALYSIS REQUIRES BINANCE WEBSOCKET FEED</span>
    </div>
  </div>
</template>

<style scoped>
</style>
