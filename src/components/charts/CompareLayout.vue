<!-- src/components/charts/CompareLayout.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import ChartPanel from './ChartPanel.vue';
import OrderBook from '../dashboard/OrderBook.vue';
import draggable from 'vuedraggable';
import ResizableSplitter from '../ui/ResizableSplitter.vue';
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

// Resizing split state
const containerRef = ref<HTMLElement | null>(null);
const splitPct = ref<number>(activeTab.value?.compareSplitPct ?? 70);

// Computed CSS values driven by splitPct
const chartAreaStyle = computed(() => ({ width: `${splitPct.value}%` }));
const sidebarStyle = computed(() => ({ width: `${100 - splitPct.value}%` }));

const panelsWritable = computed({
  get() {
    return panels.value;
  },
  set(val) {
    workspaceStore.reorderPanels(props.tabId, val);
  }
});

const onDragEnd = (evt: any) => {
  if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
    workspaceStore.swapPanels(props.tabId, evt.oldIndex, evt.newIndex);
  }
};

const onSplitterResize = (deltaX: number) => {
  if (!containerRef.value) return;
  const totalW = containerRef.value.clientWidth;
  if (totalW === 0) return;
  const deltaPct = (deltaX / totalW) * 100;
  splitPct.value = Math.min(90, Math.max(10, splitPct.value + deltaPct));
  const tab = workspaceStore.tabs.find(t => t.id === props.tabId);
  if (tab) {
    tab.compareSplitPct = splitPct.value;
  }
};
</script>

<template>
  <div ref="containerRef" class="w-full h-[calc(100vh-76px)] bg-black p-1 flex gap-1 font-mono overflow-hidden">
    <!-- Charts Area (Left Side, 70% width) -->
    <div :style="chartAreaStyle" class="h-full flex-shrink-0 overflow-hidden">
      <draggable
        v-model="panelsWritable"
        item-key="id"
        class="h-full w-full flex gap-1"
        handle=".h-8"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <div class="flex-1 h-full overflow-hidden">
            <ChartPanel :panel-id="element.id" :tab-id="props.tabId" :draggable="true" />
          </div>
        </template>
        
        <template #footer>
          <div v-if="panels.length < 2" class="flex-1 h-full flex gap-1">
            <div
              v-for="n in (2 - panels.length)"
              :key="n"
              @click="addPanel"
              class="flex-1 h-full border border-dashed border-border bg-black/40 hover:bg-surface/50 hover:border-accent-green cursor-pointer flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-white transition-all duration-150 rounded animate-pulse"
            >
              <Plus class="h-5 w-5 text-accent-green" />
              <span class="text-[9px] tracking-wider font-semibold uppercase">INITIALIZE CHART {{ panels.length + n }}</span>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Splitter -->
    <ResizableSplitter @resize="onSplitterResize" />

    <!-- Sidebar Area (Right Side, 30% width) -->
    <div :style="sidebarStyle" class="h-full overflow-hidden flex flex-col gap-1.5 flex-shrink-0">
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
          FOLLOW: {{ panels[0]?.symbol || 'CHART 1' }}
        </button>
        <button
          @click="selectedChartIndex = 1"
          class="flex-1 py-1 px-2 rounded text-center transition-all select-none truncate"
          :class="selectedChartIndex === 1 
            ? 'bg-panel text-accent-green border border-border shadow' 
            : 'text-gray-500 hover:text-gray-300'"
          :disabled="panels.length < 2"
        >
          FOLLOW: {{ panels[1]?.symbol || 'CHART 2' }}
        </button>
      </div>

      <!-- OrderBook component driven by interactive symbol state -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <OrderBook
          v-if="orderBookSymbol"
          :symbol="orderBookSymbol"
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
