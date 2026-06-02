<!-- src/components/dashboard/TestingView.vue -->
<script setup lang="ts">
import { watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { useWorkspaceStore } from '../../stores/workspace';
import OrderBook from './OrderBook.vue';
import ChartPanel from '../charts/ChartPanel.vue';
import TradeScatterTape from '../highcharts/TradeScatterTape.vue';
import CumulativeVolumeDelta from '../highcharts/CumulativeVolumeDelta.vue';
import MarketSpeedMeter from '../highcharts/MarketSpeedMeter.vue';
import BlockTradeTracker from '../highcharts/BlockTradeTracker.vue';
import OrderFlowImbalance from '../highcharts/OrderFlowImbalance.vue';

const settingsStore = useSettingsStore();
const workspaceStore = useWorkspaceStore();

// Setup the workspace testing tab panel contract for ChartPanel compatibility
const initializeTestingTab = () => {
  const testingTab = workspaceStore.tabs.find((t) => t.id === 'testing');
  if (testingTab) {
    testingTab.name = 'Bloomberg Focus View';
    testingTab.assetMode = 'crypto';
    
    const panelExists = testingTab.panels.some((p) => p.id === 'panel-testing');
    if (!panelExists) {
      testingTab.panels = [
        {
          id: 'panel-testing',
          tabId: 'testing',
          symbol: settingsStore.orderBookSymbol || 'BTCUSDT',
          exchange: 'binance',
          interval: '1h',
          chartType: 'candlestick',
          position: 0,
          showVolume: true,
        }
      ];
    }
  }
};

// Run initialization immediately
initializeTestingTab();

// Function to handle symbol selection
const selectSymbol = (sym: string) => {
  settingsStore.orderBookSymbol = sym;
  
  const testingTab = workspaceStore.tabs.find((t) => t.id === 'testing');
  if (testingTab && testingTab.panels.length > 0) {
    testingTab.panels[0].symbol = sym;
    testingTab.panels[0].exchange = 'binance';
  }
};

// Sync settings change to testing panel
watch(() => settingsStore.orderBookSymbol, (newSymbol) => {
  const testingTab = workspaceStore.tabs.find((t) => t.id === 'testing');
  if (testingTab && testingTab.panels.length > 0) {
    if (testingTab.panels[0].symbol !== newSymbol) {
      testingTab.panels[0].symbol = newSymbol;
    }
  }
});
</script>

<template>
  <div class="h-[calc(100vh-76px)] w-full bg-[#000000] p-1 flex flex-col font-mono text-white select-none overflow-hidden">
    <!-- Sub-Header / Tool Bar -->
    <div class="h-8 border-b border-[#222222] flex items-center justify-between px-2 bg-[#000000] text-[10px] mb-1">
      <div class="flex items-center gap-3">
        <span class="text-green-500 font-bold uppercase tracking-wider">
          BLOOMBERG FOCUS TERMINAL
        </span>
        <span class="text-gray-600 font-bold">|</span>
        <span class="text-amber-500 font-bold uppercase">
          {{ settingsStore.orderBookSymbol }}
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
          :class="settingsStore.orderBookSymbol === sym ? 'bg-[#00ff66]/10 border-green-500 text-green-500' : 'text-gray-400 bg-transparent'"
        >
          {{ sym.replace('USDT', '') }}
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        <span class="text-green-500 uppercase font-bold text-[8px] tracking-wide">WEBSOCKET ONLINE</span>
      </div>
    </div>

    <!-- Main Bloomberg Multi-Panel Grid Layout -->
    <div class="flex-1 min-h-0 w-full flex gap-1">
      <!-- Left Column: OrderBook.vue (25% width) -->
      <div class="w-[25%] h-full min-h-0 flex flex-col border border-[#222222] rounded overflow-hidden">
        <OrderBook 
          :symbol="settingsStore.orderBookSymbol" 
          asset-mode="crypto" 
          :allow-mode-switch="false" 
          class="h-full w-full"
        />
      </div>

      <!-- Center Column: Main Chart and CVD (45% width) -->
      <div class="w-[45%] h-full flex flex-col gap-1 min-h-0">
        <!-- Top: TradingView Lightweight ChartPanel -->
        <div class="flex-[3] min-h-0 overflow-hidden relative border border-[#222222] rounded">
          <ChartPanel 
            panel-id="panel-testing" 
            tab-id="testing" 
          />
        </div>
        <!-- Bottom: Cumulative Volume Delta Chart -->
        <div class="flex-[2] min-h-0">
          <CumulativeVolumeDelta 
            :symbol="settingsStore.orderBookSymbol" 
            asset-mode="crypto" 
          />
        </div>
      </div>

      <!-- Right Column: Tape Flow & Analytics (30% width) -->
      <div class="w-[30%] h-full flex flex-col gap-1 min-h-0">
        <!-- Top Right: Trade Flow Scatter Tape -->
        <div class="flex-[4] min-h-0">
          <TradeScatterTape 
            :symbol="settingsStore.orderBookSymbol" 
            asset-mode="crypto" 
          />
        </div>
        <!-- Middle Right: Market Speed Spline Chart -->
        <div class="flex-[3] min-h-0">
          <MarketSpeedMeter 
            :symbol="settingsStore.orderBookSymbol" 
            asset-mode="crypto" 
          />
        </div>
        <!-- Bottom Right Split Row: Order Flow Imbalance and Block Trades -->
        <div class="flex-[3] min-h-0 flex gap-1">
          <div class="w-1/2 h-full">
            <OrderFlowImbalance 
              :symbol="settingsStore.orderBookSymbol" 
              asset-mode="crypto" 
            />
          </div>
          <div class="w-1/2 h-full">
            <BlockTradeTracker 
              :symbol="settingsStore.orderBookSymbol" 
              asset-mode="crypto" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
