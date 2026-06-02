// src/composables/useLightweightChart.ts
import { shallowRef, onUnmounted } from 'vue';
import { createChart, IChartApi } from 'lightweight-charts';
import { chartThemeOptions } from '../utils/chartTheme';

export function useLightweightChart() {
  const chartInstance = shallowRef<IChartApi | null>(null);
  let resizeObserver: ResizeObserver | null = null;

  const initChart = (container: HTMLElement, accentColor?: string) => {
    if (chartInstance.value) {
      destroyChart();
    }

    const chart = createChart(container, chartThemeOptions(accentColor));
    chartInstance.value = chart;

    // Setup responsive resize listener
    resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.resize(width, height);
    });
    
    resizeObserver.observe(container);
    return chart;
  };

  const destroyChart = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (chartInstance.value) {
      chartInstance.value.remove();
      chartInstance.value = null;
    }
  };

  onUnmounted(() => {
    destroyChart();
  });

  return {
    chartInstance,
    initChart,
    destroyChart,
  };
}
