<!-- src/components/charts/CompareLayout.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import ChartPanel from './ChartPanel.vue';
import OrderBook from '../dashboard/OrderBook.vue';
import { Plus } from 'lucide-vue-next';

const props = defineProps<{
  tabId: string;
}>();

const workspaceStore = useWorkspaceStore();

const activeTab = computed(() => {
  return workspaceStore.tabs.find((t) => t.id === props.tabId)!;
});

const panels = computed(() => {
  return activeTab.value?.panels || [];
});

const selectedChartIndex = ref(0);

const orderBookSymbol = computed(() => {
  const idx = selectedChartIndex.value;
  return panels.value[idx]?.symbol || panels.value[0]?.symbol || '';
});

const addPanel = () => {
  workspaceStore.addPanel(props.tabId);
};
</script>

<template>
  <div class="w-full h-[calc(100vh-76px)] bg-black p-1 flex gap-1 font-mono">
    <!-- Charts Area (Left Side, 70% width) -->
    <div class="flex-[7] h-full flex gap-1">
      <!-- Left Chart Panel (Panel 1) -->
      <div class="flex-1 h-full overflow-hidden">
        <ChartPanel v-if="panels[0]" :panel-id="panels[0].id" :tab-id="props.tabId" />
        <div
          v-else
          @click="addPanel"
          class="h-full border border-dashed border-border bg-black/40 hover:bg-surface/50 hover:border-accent-green cursor-pointer flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-white transition-all duration-150 rounded"
        >
          <Plus class="h-5 w-5 text-accent-green animate-pulse" />
          <span class="text-[9px] tracking-wider font-semibold uppercase">INITIALIZE CHART 1</span>
        </div>
      </div>

      <!-- Right Chart Panel (Panel 2) -->
      <div class="flex-1 h-full overflow-hidden">
        <ChartPanel v-if="panels[1]" :panel-id="panels[1].id" :tab-id="props.tabId" />
        <div
          v-else
          @click="addPanel"
          class="h-full border border-dashed border-border bg-black/40 hover:bg-surface/50 hover:border-accent-green cursor-pointer flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-white transition-all duration-150 rounded"
        >
          <Plus class="h-5 w-5 text-accent-green" />
          <span class="text-[9px] tracking-wider font-semibold uppercase">INITIALIZE CHART 2</span>
        </div>
      </div>
    </div>

    <!-- Sidebar Area (Right Side, 30% width) -->
    <div class="flex-[3] h-full overflow-hidden flex flex-col gap-1.5">
      <!-- Interactive Ticker Switcher -->
      <div
        v-if="panels.length > 0"
        class="flex bg-[#0c0c0c] border border-border rounded p-0.5 text-[9px] font-bold"
      >
        <button
          @click="selectedChartIndex = 0"
          class="flex-1 py-1 px-2 rounded text-center transition-all select-none truncate"
          :class="selectedChartIndex === 0 
            ? 'bg-panel text-accent-green border border-border shadow' 
            : 'text-gray-500 hover:text-gray-300'"
        >
          FOLLOW CHART 1: {{ panels[0]?.symbol || 'N/A' }}
        </button>
        <button
          @click="selectedChartIndex = 1"
          class="flex-1 py-1 px-2 rounded text-center transition-all select-none truncate"
          :class="selectedChartIndex === 1 
            ? 'bg-panel text-accent-green border border-border shadow' 
            : 'text-gray-500 hover:text-gray-300'"
          :disabled="panels.length < 2"
        >
          FOLLOW CHART 2: {{ panels[1]?.symbol || 'N/A' }}
        </button>
      </div>

      <!-- OrderBook component driven by interactive symbol state -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <OrderBook
          v-if="orderBookSymbol"
          :symbol="orderBookSymbol"
          :asset-mode="activeTab.assetMode"
        />
        <div
          v-else
          class="h-full border border-border bg-panel flex items-center justify-center text-gray-600 text-[10px]"
        >
          WAITING FOR TICKER SETUP...
        </div>
      </div>
    </div>
  </div>
</template>
