<!-- src/components/charts/ScalperLayout.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import { useResizer } from '../../composables/useResizer';
import { Plus, Zap } from 'lucide-vue-next';
import OrderBook from '../dashboard/OrderBook.vue';
import ChartPanel from './ChartPanel.vue';
import CumulativeVolumeDelta from '../highcharts/CumulativeVolumeDelta.vue';
import LiquidationFeed from '../highcharts/LiquidationFeed.vue';
import ScalpCalculator from '../highcharts/ScalpCalculator.vue';
import MarketSpeedMeter from '../highcharts/MarketSpeedMeter.vue';
import OrderFlowImbalance from '../highcharts/OrderFlowImbalance.vue';
import WhaleTraderAlert from '../highcharts/WhaleTraderAlert.vue';

const props = defineProps<{
  tabId: string;
}>();

const rightTab = ref<'liquidation' | 'whales'>('liquidation');

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

// Resizable 3 Columns: Left (DOM), Center (Chart + CVD), Right (Liquidation + Calculator)
const { sizes: colSizes, startDrag: startColDrag } = useResizer({
  initialSizes: [24, 48, 28],
  minSize: 15,
});

// Vertical resizer inside Center Column: Chart vs CVD
const { sizes: centerSizes, startDrag: startCenterDrag } = useResizer({
  initialSizes: [65, 35],
  minSize: 20,
});

// Vertical resizer inside Left Column: OrderBook vs MarketSpeed
const { sizes: leftSizes, startDrag: startLeftDrag } = useResizer({
  initialSizes: [72, 28],
  minSize: 15,
});

// Vertical resizer inside Right Column: Liquidation vs Scalp Calc
const { sizes: rightSizes, startDrag: startRightDrag } = useResizer({
  initialSizes: [52, 48],
  minSize: 20,
});
</script>

<template>
  <div class="w-full h-[calc(100vh-76px)] bg-[#000000] p-1 flex flex-col font-mono text-white select-none overflow-hidden">
    <!-- Placeholder if no panels -->
    <div
      v-if="panels.length === 0"
      @click="workspaceStore.addPanel(props.tabId)"
      class="flex-1 border border-dashed border-[#222222] bg-black/40 hover:bg-[#111111]/50 hover:border-green-500 cursor-pointer flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-white transition-all duration-150 rounded"
    >
      <Plus class="h-5 w-5 text-green-500" />
      <span class="text-[9px] font-mono tracking-wider font-semibold uppercase">INITIALIZE SCALPER DESK</span>
    </div>

    <template v-else>
      <!-- Sub-Header / Tool Bar -->
      <div class="h-8 border-b border-[#222222] flex items-center justify-between px-2 bg-[#000000] text-[10px] mb-1">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-amber-500 font-bold uppercase tracking-wider">
            <Zap class="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>FUTURES SCALPER WAR ROOM</span>
          </div>
          <span class="text-gray-700 font-bold">|</span>
          <!-- Active Symbol with Input -->
          <div class="flex items-center gap-1">
            <input
              v-model="symbolInput"
              @keydown.enter="updateSymbol"
              @blur="updateSymbol"
              class="w-20 bg-[#0a0a0a] border border-[#333333] hover:border-gray-500 focus:border-green-500 px-1.5 py-0.5 rounded text-[10px] text-green-400 font-bold uppercase text-center focus:outline-none"
            />
            <span class="text-[8px] text-gray-500 uppercase">FUTURES PERPETUAL</span>
          </div>
        </div>

        <!-- Quick Keys for Scalper pairs -->
        <div class="flex items-center gap-1">
          <span class="text-gray-600 mr-1 uppercase text-[8px] tracking-wide">SCALP PAIRS:</span>
          <button
            v-for="sym in ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'XRPUSDT', 'PEPEUSDT']"
            :key="sym"
            @click="selectSymbol(sym)"
            class="px-1.5 py-0.5 border border-[#2b2b2b] hover:border-green-500 hover:text-green-500 text-[9px] rounded font-bold uppercase transition-all duration-100"
            :class="activeSymbol === sym ? 'bg-green-500/10 border-green-500 text-green-400' : 'text-gray-400 bg-transparent'"
          >
            {{ sym.replace('USDT', '') }}
          </button>
        </div>

        <!-- Status Tag -->
        <div class="flex items-center gap-2">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span class="text-green-500 uppercase font-bold text-[8px] tracking-wide">
            BINANCE FSTREAM ACTIVE
          </span>
        </div>
      </div>

      <!-- 3-Column Resizable Layout -->
      <div class="flex-1 min-h-0 w-full flex overflow-hidden">
        <!-- COLUMN 1: DOM / OrderBook & Market Speed -->
        <div :style="{ width: `${colSizes[0]}%` }" class="h-full min-h-0 flex flex-col overflow-hidden">
          <div :style="{ height: `${leftSizes[0]}%` }" class="w-full min-h-0 border border-[#222222] rounded overflow-hidden">
            <OrderBook :symbol="activeSymbol" :allow-mode-switch="false" class="h-full w-full" />
          </div>

          <div
            @mousedown="startLeftDrag(0, $event, 'vertical')"
            class="h-1 w-full bg-[#111111] hover:bg-green-500/50 cursor-row-resize transition-colors my-0.5"
          ></div>

          <div :style="{ height: `${leftSizes[1]}%` }" class="w-full min-h-0 border border-[#222222] rounded overflow-hidden">
            <MarketSpeedMeter :symbol="activeSymbol" class="h-full w-full" />
          </div>
        </div>

        <!-- Splitter 1 -->
        <div
          @mousedown="startColDrag(0, $event, 'horizontal')"
          class="w-1 h-full bg-[#111111] hover:bg-green-500/50 cursor-col-resize transition-colors mx-0.5"
        ></div>

        <!-- COLUMN 2: Main Scalper Candle Chart + CVD -->
        <div :style="{ width: `${colSizes[1]}%` }" class="h-full min-h-0 flex flex-col overflow-hidden">
          <!-- Main Candle Chart -->
          <div :style="{ height: `${centerSizes[0]}%` }" class="w-full min-h-0 border border-[#222222] rounded overflow-hidden">
            <ChartPanel
              v-if="panels[0]"
              :panel-id="panels[0].id"
              :tab-id="props.tabId"
              :draggable="false"
              class="h-full w-full"
            />
          </div>

          <!-- Splitter Vertical -->
          <div
            @mousedown="startCenterDrag(0, $event, 'vertical')"
            class="h-1 w-full bg-[#111111] hover:bg-green-500/50 cursor-row-resize transition-colors my-0.5"
          ></div>

          <!-- Cumulative Volume Delta & Imbalance -->
          <div :style="{ height: `${centerSizes[1]}%` }" class="w-full min-h-0 flex gap-1 overflow-hidden">
            <div class="flex-1 h-full border border-[#222222] rounded overflow-hidden">
              <CumulativeVolumeDelta :symbol="activeSymbol" class="h-full w-full" />
            </div>
            <div class="w-1/3 h-full border border-[#222222] rounded overflow-hidden">
              <OrderFlowImbalance :symbol="activeSymbol" class="h-full w-full" />
            </div>
          </div>
        </div>

        <!-- Splitter 2 -->
        <div
          @mousedown="startColDrag(1, $event, 'horizontal')"
          class="w-1 h-full bg-[#111111] hover:bg-green-500/50 cursor-col-resize transition-colors mx-0.5"
        ></div>

        <!-- COLUMN 3: Live Liquidation Feed / Whale Alert & Fast Scalp Calculator -->
        <div :style="{ width: `${colSizes[2]}%` }" class="h-full min-h-0 flex flex-col overflow-hidden">
          <!-- Top Panel with Tab Switcher: Liquidation vs Whale Alerts -->
          <div :style="{ height: `${rightSizes[0]}%` }" class="w-full min-h-0 border border-[#222222] rounded overflow-hidden flex flex-col">
            <!-- Mini Tab Bar -->
            <div class="h-6 bg-[#080808] border-b border-[#222222] flex items-center px-1 gap-1">
              <button
                @click="rightTab = 'liquidation'"
                class="px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider transition-all"
                :class="rightTab === 'liquidation' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-500 hover:text-white'"
              >
                Liquidations
              </button>
              <button
                @click="rightTab = 'whales'"
                class="px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider transition-all"
                :class="rightTab === 'whales' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-white'"
              >
                Whale Alerts
              </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 min-h-0">
              <LiquidationFeed v-if="rightTab === 'liquidation'" :symbol="activeSymbol" class="h-full w-full" />
              <WhaleTraderAlert v-else :symbol="activeSymbol" class="h-full w-full" />
            </div>
          </div>

          <!-- Splitter Vertical -->
          <div
            @mousedown="startRightDrag(0, $event, 'vertical')"
            class="h-1 w-full bg-[#111111] hover:bg-green-500/50 cursor-row-resize transition-colors my-0.5"
          ></div>

          <!-- Scalp Risk & Sizing Calculator -->
          <div :style="{ height: `${rightSizes[1]}%` }" class="w-full min-h-0 border border-[#222222] rounded overflow-hidden">
            <ScalpCalculator :symbol="activeSymbol" class="h-full w-full" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
