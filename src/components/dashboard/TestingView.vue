<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import * as Highcharts from 'highcharts/highstock';

const settingsStore = useSettingsStore();
const chartContainer = ref<HTMLElement | null>(null);
let chart: any = null;

// Generate mock stock data for AAPL
const generateMockStockData = () => {
  const data = [];
  let time = Date.UTC(2025, 0, 1);
  let close = 150;
  
  for (let i = 0; i < 500; i++) {
    const o = close + (Math.random() - 0.5) * 4;
    const h = o + Math.random() * 3;
    const l = o - Math.random() * 3;
    const c = (h + l) / 2 + (Math.random() - 0.5) * 2;
    const v = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push([
      time,
      o,
      h,
      l,
      c,
      v
    ]);
    
    time += 24 * 3600 * 1000; // Increment 1 day
    close = c;
  }
  return data;
};

const initHighcharts = () => {
  if (!chartContainer.value) return;
  
  const mockData = generateMockStockData();
  const ohlc = [];
  const volume = [];
  
  for (let i = 0; i < mockData.length; i += 1) {
    ohlc.push([
      mockData[i][0], // the date
      mockData[i][1], // open
      mockData[i][2], // high
      mockData[i][3], // low
      mockData[i][4]  // close
    ]);

    volume.push([
      mockData[i][0], // the date
      mockData[i][5]  // the volume
    ]);
  }

  chart = Highcharts.stockChart(chartContainer.value, {
    chart: {
      backgroundColor: '#000000',
      style: {
        fontFamily: 'monospace'
      }
    },
    title: {
      text: 'HIGHCHARTS STOCK DEMO - APPLE INC. (SIMULATED)',
      style: {
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    },
    rangeSelector: {
      selected: 1,
      buttonTheme: {
        fill: '#1e1e1e',
        stroke: '#333333',
        style: {
          color: '#888888',
          fontWeight: 'bold'
        },
        states: {
          hover: {
            fill: '#333333',
            style: {
              color: '#ffffff'
            }
          },
          select: {
            fill: settingsStore.accentColor,
            style: {
              color: '#000000'
            }
          }
        }
      },
      inputBoxBorderColor: '#333333',
      inputStyle: {
        backgroundColor: '#1e1e1e',
        color: '#ffffff'
      },
      labelStyle: {
        color: '#888888'
      }
    },
    yAxis: [{
      labels: {
        align: 'right',
        x: -3,
        style: {
          color: '#888888'
        }
      },
      title: {
        text: 'OHLC',
        style: {
          color: '#ffffff'
        }
      },
      height: '60%',
      lineWidth: 2,
      gridLineColor: '#1e1e1e',
      lineColor: '#333333'
    }, {
      labels: {
        align: 'right',
        x: -3,
        style: {
          color: '#888888'
        }
      },
      title: {
        text: 'Volume',
        style: {
          color: '#ffffff'
        }
      },
      top: '65%',
      height: '35%',
      offset: 0,
      lineWidth: 2,
      gridLineColor: '#1e1e1e',
      lineColor: '#333333'
    }],
    xAxis: {
      gridLineColor: '#1e1e1e',
      lineColor: '#333333',
      labels: {
        style: {
          color: '#888888'
        }
      }
    },
    series: [{
      type: 'candlestick',
      name: 'AAPL',
      data: ohlc,
      color: '#ff4444',
      upColor: settingsStore.accentColor,
      lineColor: '#ff4444',
      upLineColor: settingsStore.accentColor,
      dataGrouping: {
        units: [[
          'week',                         // unit name
          [1]                             // allowed multiples
        ], [
          'month',
          [1, 2, 3, 4, 6]
        ]]
      }
    }, {
      type: 'column',
      name: 'Volume',
      data: volume,
      yAxis: 1,
      color: settingsStore.accentColor + '80',
      dataGrouping: {
        units: [[
          'week',
          [1]
        ], [
          'month',
          [1, 2, 3, 4, 6]
        ]]
      }
    }],
    navigator: {
      outlineColor: '#333333',
      maskFill: settingsStore.accentColor + '15',
      series: {
        color: settingsStore.accentColor,
        fillOpacity: 0.05
      },
      xAxis: {
        gridLineColor: '#1e1e1e',
        labels: {
          style: {
            color: '#888888'
          }
        }
      }
    },
    scrollbar: {
      barBackgroundColor: '#1e1e1e',
      barBorderColor: '#333333',
      buttonBackgroundColor: '#1e1e1e',
      buttonBorderColor: '#333333',
      buttonArrowColor: '#888888',
      trackBackgroundColor: '#000000',
      trackBorderColor: '#1e1e1e'
    },
    credits: {
      enabled: false
    },
    plotOptions: {
      candlestick: {
        shadow: false
      }
    }
  });
};

onMounted(() => {
  initHighcharts();
});

onUnmounted(() => {
  if (chart) {
    chart.destroy();
  }
});

watch(() => settingsStore.accentColor, () => {
  if (chart) {
    chart.destroy();
    initHighcharts();
  }
});
</script>

<template>
  <div class="h-full w-full bg-black p-4 flex flex-col font-mono text-white">
    <!-- Header -->
    <div class="h-10 border-b border-border flex items-center justify-between px-3 bg-black text-xs mb-4">
      <span class="text-accent-green uppercase font-bold tracking-wider">
        HIGHCHARTS STOCK TESTING LAB
      </span>
      <span class="text-gray-500 font-bold uppercase tracking-wider">
        [DEMO MODE]
      </span>
    </div>
    
    <!-- Chart Container -->
    <div class="flex-1 w-full bg-black border border-border rounded relative p-2 overflow-hidden">
      <div ref="chartContainer" class="w-full h-full"></div>
    </div>
  </div>
</template>

<style scoped>
/* Customize scrollbar or highcharts elements if necessary */
</style>
