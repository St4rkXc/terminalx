<!-- src/components/highcharts/TradeScatterTape.vue -->
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

let pointBuffer: any[] = [];
let redrawTimer: any = null;
const REDRAW_INTERVAL = 500; // Update chart every 500ms

const initChart = () => {
  if (!chartRef.value) return;

  const options: Highcharts.Options = {
    chart: {
      type: 'scatter',
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
      text: 'REAL-TIME TRADE FLOW TAPE',
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
      formatter: function(this: any): string {
        const point: any = this.point;
        const time = Highcharts.dateFormat('%H:%M:%S.%L', this.x as number);
        const type = point.isMaker ? 'SELL' : 'BUY';
        const color = point.isMaker ? '#ff3333' : '#00ff66';
        return `<b>TIME:</b> ${time}<br/>` +
               `<b>PRICE:</b> <span style="color: ${color}">${this.y}</span><br/>` +
               `<b>QTY:</b> ${point.q}<br/>` +
               `<b>SIDE:</b> <span style="color: ${color}">${type}</span>`;
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      scatter: {
        marker: {
          symbol: 'circle',
          lineColor: '#000000',
          lineWidth: 1
        },
        states: {
          hover: {
            enabled: true,
            lineWidth: 1
          }
        }
      }
    },
    series: [{
      type: 'scatter',
      name: 'Trade Flow',
      data: [],
      marker: {
        radius: 4
      }
    }]
  };

  chart = Highcharts.chart(chartRef.value, options);
};

const handleTradeMessage = (data: any) => {
  if (!chart || props.assetMode !== 'crypto') return;

  const price = parseFloat(data.p);
  const qty = parseFloat(data.q);
  const isMaker = data.m; // true = sell, false = buy
  const timestamp = Number(data.E);

  // Map quantity to a reasonable visual radius
  const minRadius = 3;
  const maxRadius = 15;
  // Use log scale so giant blocks don't take up the whole screen
  const radius = Math.max(minRadius, Math.min(maxRadius, minRadius + Math.log10(qty + 1) * 3));

  const pointColor = isMaker ? '#ff3333' : '#00ff66';

  const pointOptions: any = {
    x: timestamp,
    y: price,
    marker: {
      radius: radius,
      fillColor: pointColor
    },
    isMaker: isMaker,
    q: data.q
  };

  pointBuffer.push(pointOptions);
  if (pointBuffer.length > 100) {
    pointBuffer.shift();
  }
};

const subscribeToWS = () => {
  unsubscribeFromWS();

  if (props.assetMode !== 'crypto') return;

  const streamName = `${props.symbol.toLowerCase()}@trade`;
  currentSubscription = streamName;
  wsManager.subscribe(streamName, handleTradeMessage);

  // Performance Fix: Update the chart periodically instead of on every tick
  redrawTimer = setInterval(() => {
    if (chart && chart.series[0] && pointBuffer.length > 0) {
      chart.series[0].setData([...pointBuffer], true, false, false);
    }
  }, REDRAW_INTERVAL);
};

const unsubscribeFromWS = () => {
  if (redrawTimer) {
    clearInterval(redrawTimer);
    redrawTimer = null;
  }
  if (currentSubscription) {
    wsManager.unsubscribe(currentSubscription, handleTradeMessage);
    currentSubscription = null;
  }
};

const clearChartData = () => {
  pointBuffer = [];
  if (chart && chart.series[0]) {
    chart.series[0].setData([]);
  }
};

watch(() => props.symbol, () => {
  clearChartData();
  subscribeToWS();
});

watch(() => props.assetMode, () => {
  clearChartData();
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
      <span class="text-[#888888] text-[9px]">REAL-TIME TRADE FLOW HISTOGRAM REQUIRES BINANCE WEBSOCKET FEED</span>
    </div>
  </div>
</template>

<style scoped>
</style>
