<!-- src/components/charts/FocusedLayout.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import { Plus } from 'lucide-vue-next';
import OrderBook from '../dashboard/OrderBook.vue';
import ChartPanel from './ChartPanel.vue';
import TradeScatterTape from '../highcharts/TradeScatterTape.vue';
import CumulativeVolumeDelta from '../highcharts/CumulativeVolumeDelta.vue';
import MarketSpeedMeter from '../highcharts/MarketSpeedMeter.vue';
import BlockTradeTracker from '../highcharts/BlockTradeTracker.vue';
import OrderFlowImbalance from '../highcharts/OrderFlowImbalance.vue';

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

const activeSymbol = computed(() => {
  return panels.value[0]?.symbol || 'BTCUSDT';
});

// Function to handle symbol selection
const selectSymbol = (sym: string) => {
  if (panels.value.length > 0) {
    workspaceStore.updatePanel(props.tabId, panels.value[0].id, {
      symbol: sym,
    });
  }
};
</script>

<template>
  <div class="w-full h-[calc(100vh-76px)] bg-[#000000] p-1 flex flex-col font-mono text-white select-none overflow-hidden">
    <!-- Placeholder if no panels are found -->
    <div
      v-if="panels.length === 0"
      @click="workspaceStore.addPanel(props.tabId)"
      class="flex-1 border border-dashed border-[#222222] bg-black/40 hover:bg-[#111111]/50 hover:border-green-500 cursor-pointer flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-white transition-all duration-150 rounded"
    >
      <Plus class="h-5 w-5 text-green-500" />
      <span class="text-[9px] font-mono tracking-wider font-semibold uppercase">INITIALIZE CHART</span>
    </div>

    <template v-else>
      <!-- Sub-Header / Tool Bar -->
      <div class="h-8 border-b border-[#222222] flex items-center justify-between px-2 bg-[#000000] text-[10px] mb-1">
        <div class="flex items-center gap-3">
          <span class="text-green-500 font-bold uppercase tracking-wider">
            BLOOMBERG FOCUS TERMINAL
          </span>
          <span class="text-gray-600 font-bold">|</span>
          <span class="text-amber-500 font-bold uppercase">
            {{ activeSymbol }}
          </span>
        </div>
        
        <!-- Symbol Quick Buttons -->
        <div class="flex items-center gap-1">
          <span class="text-gray-500 mr-2 uppercase text-[8px] tracking-wide">quick keys:</span>
          <button 
            v-for="sym in ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT']"
            :key="sym"
            @click="selectSymbol(sym)"
            class="px-1.5 py-0.5 border border-[#333333] hover:border-green-500 hover:text-green-500 text-[9px] rounded font-bold uppercase transition-all duration-100"
            :class="activeSymbol === sym ? 'bg-[#00ff66]/10 border-green-500 text-green-500' : 'text-gray-400 bg-transparent'"
          >
            {{ sym.replace('USDT', '') }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span class="text-green-500 uppercase font-bold text-[8px] tracking-wide">
            WEBSOCKET ONLINE
          </span>
        </div>
      </div>

      <!-- Main Bloomberg Multi-Panel Grid Layout -->
      <div class="flex-1 min-h-0 w-full flex gap-1">
        <!-- Left Column: OrderBook.vue (25% width) -->
        <div class="w-[25%] h-full min-h-0 flex flex-col border border-[#222222] rounded overflow-hidden">
          <OrderBook 
            :symbol="activeSymbol" 
            :allow-mode-switch="false" 
            class="h-full w-full"
          />
        </div>

        <!-- Center Column: Main Chart and CVD (45% width) -->
        <div class="w-[45%] h-full flex flex-col gap-1 min-h-0">
          <!-- Top: TradingView Lightweight ChartPanel -->
          <div class="flex-[3] min-h-0 overflow-hidden relative border border-[#222222] rounded">
            <ChartPanel 
              :panel-id="panels[0].id" 
              :tab-id="props.tabId" 
            />
          </div>
          <!-- Bottom: Cumulative Volume Delta Chart -->
          <div class="flex-[2] min-h-0">
            <CumulativeVolumeDelta 
              :symbol="activeSymbol" 
            />
          </div>
        </div>

        <!-- Right Column: Tape Flow & Analytics (30% width) -->
        <div class="w-[30%] h-full flex flex-col gap-1 min-h-0">
          <!-- Top Right: Trade Flow Scatter Tape -->
          <div class="flex-[4] min-h-0">
            <TradeScatterTape 
              :symbol="activeSymbol" 
            />
          </div>
          <!-- Middle Right: Market Speed Spline Chart -->
          <div class="flex-[3] min-h-0">
            <MarketSpeedMeter 
              :symbol="activeSymbol" 
            />
          </div>
          <!-- Bottom Right Split Row: Order Flow Imbalance and Block Trades -->
          <div class="flex-[3] min-h-0 flex gap-1">
            <div class="w-1/2 h-full">
              <OrderFlowImbalance 
                :symbol="activeSymbol" 
              />
            </div>
            <div class="w-1/2 h-full">
              <BlockTradeTracker 
                :symbol="activeSymbol" 
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
</style>
