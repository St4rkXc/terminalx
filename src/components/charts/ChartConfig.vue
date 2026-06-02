<!-- src/components/charts/ChartConfig.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Panel, Interval, ChartType } from '../../types';
import { useWorkspaceStore } from '../../stores/workspace';
import { Search } from 'lucide-vue-next';

const props = defineProps<{
  panel: Panel;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useWorkspaceStore();

const searchSymbol = ref(props.panel.symbol);


const popularCrypto = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 
  'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 
  'NEARUSDT', 'OPUSDT', 'ARBUSDT', 'MATICUSDT'
];

const popularSymbols = computed(() => {
  return popularCrypto;
});

const filteredSymbols = computed(() => {
  const query = searchSymbol.value.trim().toUpperCase();
  if (!query) return popularSymbols.value;
  const filtered = popularSymbols.value.filter(s => s.includes(query));
  if (filtered.length === 0 && query.length > 0) {
    return [query];
  }
  return filtered;
});

const intervals: Interval[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
const chartTypes: { label: string; value: ChartType }[] = [
  { label: 'Candles', value: 'candlestick' },
  { label: 'Line', value: 'line' },
  { label: 'Bar', value: 'bar' },
  { label: 'Area', value: 'area' },
];

const selectSymbol = (sym: string) => {
  store.updatePanel(props.panel.tabId, props.panel.id, { symbol: sym });
  emit('close');
};

const selectInterval = (intv: Interval) => {
  store.updatePanel(props.panel.tabId, props.panel.id, { interval: intv });
  emit('close');
};

const selectChartType = (type: ChartType) => {
  store.updatePanel(props.panel.tabId, props.panel.id, { chartType: type });
  emit('close');
};
</script>

<template>
  <div class="absolute inset-0 z-30 bg-black/85 flex flex-col p-4 border border-border font-mono select-none">
    <div class="flex items-center justify-between pb-2 border-b border-border">
      <span class="text-[10px] text-accent-green uppercase font-bold tracking-wider">
        Panel Configuration
      </span>
      <button @click="$emit('close')" class="text-gray-500 hover:text-white text-xs">
        [CLOSE]
      </button>
    </div>

    <div class="flex-1 overflow-y-auto py-3 space-y-4 text-xs">
      <!-- Symbol Search -->
      <div class="space-y-1.5">
        <label class="text-[10px] text-gray-500 uppercase tracking-wide block font-semibold">
          Select Asset / Symbol
        </label>
        <div class="relative flex items-center">
          <Search class="absolute left-2.5 h-3.5 w-3.5 text-gray-500" />
          <input
            v-model="searchSymbol"
            placeholder="Search symbols..."
            class="w-full bg-surface border border-border rounded pl-8 pr-2 py-1 focus:border-accent-green focus:outline-none text-white text-[11px]"
            @keydown.enter="filteredSymbols.length > 0 && selectSymbol(filteredSymbols[0])"
          />
        </div>
        <div class="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto mt-1 pr-1">
          <button
            v-for="sym in filteredSymbols"
            :key="sym"
            @click="selectSymbol(sym)"
            class="text-left px-2 py-1 rounded hover:bg-surface transition-colors truncate text-[10px]"
            :class="props.panel.symbol === sym ? 'text-accent-green bg-surface/50 font-bold' : 'text-gray-400'"
          >
            {{ sym }}
          </button>
        </div>
      </div>

      <!-- Timeframe Selection -->
      <div class="space-y-1.5">
        <label class="text-[10px] text-gray-500 uppercase tracking-wide block font-semibold">
          Timeframe / Interval
        </label>
        <div class="grid grid-cols-4 gap-1">
          <button
            v-for="intv in intervals"
            :key="intv"
            @click="selectInterval(intv)"
            class="px-2 py-1 rounded border border-border bg-black text-center text-[10px] hover:bg-surface transition-colors"
            :class="props.panel.interval === intv ? 'text-accent-green border-accent-green font-bold bg-surface/30' : 'text-gray-400'"
          >
            {{ intv }}
          </button>
        </div>
      </div>

      <!-- Chart Type Selection -->
      <div class="space-y-1.5">
        <label class="text-[10px] text-gray-500 uppercase tracking-wide block font-semibold">
          Style
        </label>
        <div class="grid grid-cols-2 gap-1">
          <button
            v-for="type in chartTypes"
            :key="type.value"
            @click="selectChartType(type.value)"
            class="px-2 py-1 rounded border border-border bg-black text-center text-[10px] hover:bg-surface transition-colors"
            :class="props.panel.chartType === type.value ? 'text-accent-green border-accent-green font-bold bg-surface/30' : 'text-gray-400'"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
