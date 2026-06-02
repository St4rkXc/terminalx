<!-- src/components/charts/DetailedLayout.vue -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useWorkspaceStore } from "../../stores/workspace";
import { Plus } from "lucide-vue-next";
import OrderBook from "../dashboard/OrderBook.vue";
import OrderFlowImbalance from "../highcharts/OrderFlowImbalance.vue";
import DepthHeatmap from "../highcharts/DepthHeatmap.vue";
import CumulativeVolumeDelta from "../highcharts/CumulativeVolumeDelta.vue";
import VolumeProfile from "../highcharts/VolumeProfile.vue";
import TradeScatterTape from "../highcharts/TradeScatterTape.vue";
import LiquidationFeed from "../highcharts/LiquidationFeed.vue";
import BlockTradeTracker from "../highcharts/BlockTradeTracker.vue";
import MarketSpeedMeter from "../highcharts/MarketSpeedMeter.vue";
import VolatilityGauge from "../highcharts/VolatilityGauge.vue";

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
  return panels.value[0]?.symbol || "BTCUSDT";
});

const symbolInput = ref(activeSymbol.value);

watch(activeSymbol, (newVal) => {
  symbolInput.value = newVal;
});

const selectSymbol = (sym: string) => {
  if (panels.value.length > 0) {
    workspaceStore.updatePanel(props.tabId, panels.value[0].id, {
      symbol: sym,
    });
  }
};

const updateSymbol = () => {
  const sym = symbolInput.value.trim().toUpperCase();
  if (sym.length > 0) {
    selectSymbol(sym);
  }
};
</script>

<template>
  <div
    class="w-full h-[calc(100vh-76px)] bg-[#000000] p-1 flex flex-col font-mono text-white select-none overflow-hidden"
  >
    <!-- Placeholder if no panels are found -->
    <div
      v-if="panels.length === 0"
      @click="workspaceStore.addPanel(props.tabId)"
      class="flex-1 border border-dashed border-[#222222] bg-black/40 hover:bg-[#111111]/50 hover:border-green-500 cursor-pointer flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-white transition-all duration-150 rounded"
    >
      <Plus class="h-5 w-5 text-green-500" />
      <span class="text-[9px] font-mono tracking-wider font-semibold uppercase"
        >INITIALIZE ANALYTICAL DESK</span
      >
    </div>

    <template v-else>
      <!-- Sub-Header / Tool Bar -->
      <div
        class="h-8 border-b border-[#222222] flex items-center justify-between px-2 bg-[#000000] text-[10px] mb-1"
      >
        <div class="flex items-center gap-3">
          <span class="text-green-500 font-bold uppercase tracking-wider">
            BLOOMBERG ANALYTICAL DESK
          </span>
          <span class="text-gray-600 font-bold">|</span>
          <div class="flex items-center space-x-1.5 text-zinc-500">
            <span class="font-bold text-gray-400">SYMBOL:</span>
            <input
              v-model="symbolInput"
              @blur="updateSymbol"
              @keydown.enter="updateSymbol"
              class="bg-[#111111] border border-[#333333] rounded px-1.5 py-0.5 text-white w-18 font-mono font-bold uppercase focus:border-green-500 focus:outline-none text-[9px]"
              placeholder="BTCUSDT"
            />
          </div>
        </div>

        <!-- Symbol Quick Buttons -->
        <div class="flex items-center gap-1">
          <span class="text-gray-500 mr-2 uppercase text-[8px] tracking-wide"
            >quick keys:</span
          >
          <button
            v-for="sym in [
              'BTCUSDT',
              'ETHUSDT',
              'SOLUSDT',
              'BNBUSDT',
              'DOGEUSDT',
              'XRPUSDT',
            ]"
            :key="sym"
            @click="selectSymbol(sym)"
            class="px-1.5 py-0.5 border border-[#333333] hover:border-green-500 hover:text-green-500 text-[9px] rounded font-bold uppercase transition-all duration-100"
            :class="
              activeSymbol === sym
                ? 'bg-[#00ff66]/10 border-green-500 text-green-500'
                : 'text-gray-400 bg-transparent'
            "
          >
            {{ sym.replace("USDT", "") }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span
            class="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
          ></span>
          <span
            class="text-green-500 uppercase font-bold text-[8px] tracking-wide"
          >
            WEBSOCKET ONLINE
          </span>
        </div>
      </div>

      <!-- Main Bloomberg Grid Layout (4 Columns) -->
      <div class="flex-1 min-h-0 w-full flex gap-1">
        <!-- Col 1: Order Book & Imbalance (20% width) -->
        <div class="w-[25%] h-full flex flex-col gap-1 min-h-0">
          <div class="flex-[3] min-h-0">
            <OrderBook
              :symbol="activeSymbol"
              :allow-mode-switch="false"
              :compact="true"
              class="h-full w-full"
            />
          </div>
          <div class="flex-[2] min-h-0">
            <OrderFlowImbalance :symbol="activeSymbol" />
          </div>
        </div>

        <!-- Col 2: Depth Heatmap & CVD (25% width) -->
        <div class="w-[25%] h-full flex flex-col gap-1 min-h-0">
          <div class="flex-1 min-h-0">
            <DepthHeatmap :symbol="activeSymbol" />
          </div>
          <div class="flex-1 min-h-0">
            <CumulativeVolumeDelta :symbol="activeSymbol" />
          </div>
        </div>

        <!-- Col 3: Volume Profile & Scatter Tape (30% width) -->
        <div class="w-[30%] h-full flex flex-col gap-1 min-h-0">
          <div class="flex-1 min-h-0">
            <VolumeProfile :symbol="activeSymbol" />
          </div>
          <div class="flex-1 min-h-0">
            <TradeScatterTape :symbol="activeSymbol" />
          </div>
        </div>

        <!-- Col 4: Feed & Velocity Stats (25% width) -->
        <div class="w-[25%] h-full flex flex-col gap-1 min-h-0">
          <div class="flex-[3] min-h-0">
            <LiquidationFeed :symbol="activeSymbol" />
          </div>
          <div class="flex-[2] min-h-0">
            <BlockTradeTracker :symbol="activeSymbol" />
          </div>
          <div class="flex-[2] min-h-0">
            <MarketSpeedMeter :symbol="activeSymbol" />
          </div>
          <div class="flex-[2] min-h-0">
            <VolatilityGauge :symbol="activeSymbol" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped></style>
