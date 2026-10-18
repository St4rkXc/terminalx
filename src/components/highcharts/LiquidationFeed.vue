<!-- src/components/highcharts/LiquidationFeed.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { futuresWSManager } from '../../composables/useBinanceFuturesWS';
import { Volume2, VolumeX, Trash2, ShieldAlert } from 'lucide-vue-next';

const props = defineProps<{
  symbol?: string;
}>();

const filterCurrentSymbol = ref(false);
const minUsdFilter = ref(1000); // Filter >= $1k default

const liquidations = computed(() => {
  let list = futuresWSManager.liquidations.value;
  if (filterCurrentSymbol.value && props.symbol) {
    const sym = props.symbol.toUpperCase();
    list = list.filter((l) => l.symbol.toUpperCase() === sym);
  }
  if (minUsdFilter.value > 0) {
    list = list.filter((l) => l.usdValue >= minUsdFilter.value);
  }
  return list;
});

const totalLongs = computed(() => futuresWSManager.totalLongLiqUsd.value);
const totalShorts = computed(() => futuresWSManager.totalShortLiqUsd.value);
const totalSum = computed(() => totalLongs.value + totalShorts.value);
const longPct = computed(() => {
  if (totalSum.value === 0) return 50;
  return Math.round((totalLongs.value / totalSum.value) * 100);
});

const formatCurrency = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toLocaleString()}`;
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toTimeString().split(' ')[0];
};

const toggleSound = () => {
  futuresWSManager.soundEnabled.value = !futuresWSManager.soundEnabled.value;
};

const clearData = () => {
  futuresWSManager.clearStats();
};
</script>

<template>
  <div class="h-full w-full bg-[#000000] border border-[#222222] flex flex-col font-mono text-white select-none overflow-hidden">
    <!-- Header -->
    <div class="h-8 border-b border-[#222222] bg-[#050505] px-2.5 flex items-center justify-between text-[10px]">
      <div class="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-500">
        <ShieldAlert class="h-3.5 w-3.5 text-amber-500 animate-pulse" />
        <span>Live Liquidation Feed</span>
        <span class="text-[8px] px-1 py-0.2 bg-[#1a1a1a] text-gray-400 rounded border border-[#333333]">FUTURES</span>
      </div>

      <div class="flex items-center gap-1.5">
        <!-- Filter current symbol toggle -->
        <button
          v-if="symbol"
          @click="filterCurrentSymbol = !filterCurrentSymbol"
          class="px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all"
          :class="filterCurrentSymbol ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'text-gray-500 border-[#333333] hover:text-white'"
          :title="filterCurrentSymbol ? 'Showing only ' + symbol : 'Showing all futures symbols'"
        >
          {{ filterCurrentSymbol ? symbol.replace('USDT', '') : 'ALL COINS' }}
        </button>

        <!-- Sound Alert Toggle -->
        <button
          @click="toggleSound"
          class="p-1 rounded text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          :title="futuresWSManager.soundEnabled.value ? 'Mute Alert Sound' : 'Enable Alert Sound for >$30k liq'"
        >
          <Volume2 v-if="futuresWSManager.soundEnabled.value" class="h-3.5 w-3.5 text-green-500" />
          <VolumeX v-else class="h-3.5 w-3.5" />
        </button>

        <!-- Reset Button -->
        <button
          @click="clearData"
          class="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-[#1a1a1a] transition-colors"
          title="Reset stats"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Stats Bar (Longs vs Shorts Rekt Bar) -->
    <div class="px-2.5 py-2 border-b border-[#222222] bg-[#080808] flex flex-col gap-1.5">
      <div class="flex items-center justify-between text-[9px] font-bold">
        <span class="text-red-500">
          LONG LIQ: {{ formatCurrency(totalLongs) }} ({{ longPct }}%)
        </span>
        <span class="text-green-500">
          SHORT LIQ: {{ formatCurrency(totalShorts) }} ({{ 100 - longPct }}%)
        </span>
      </div>
      <!-- Meter Bar -->
      <div class="h-1.5 w-full bg-[#161616] rounded-full overflow-hidden flex">
        <div class="bg-red-500 h-full transition-all duration-300" :style="{ width: `${longPct}%` }"></div>
        <div class="bg-green-500 h-full transition-all duration-300" :style="{ width: `${100 - longPct}%` }"></div>
      </div>
    </div>

    <!-- Feed Table -->
    <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden text-[9px]">
      <table class="w-full border-collapse">
        <thead class="sticky top-0 bg-[#0c0c0c] text-gray-500 border-b border-[#222222] text-[8px] uppercase tracking-wider font-semibold z-10">
          <tr>
            <th class="py-1 px-2 text-left">Time</th>
            <th class="py-1 px-1 text-left">Pair</th>
            <th class="py-1 px-1 text-center">Type</th>
            <th class="py-1 px-2 text-right">Price</th>
            <th class="py-1 px-2 text-right">Size (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="liq in liquidations"
            :key="liq.id"
            class="border-b border-[#141414] hover:bg-[#121212] transition-colors font-mono"
            :class="liq.usdValue >= 50000 ? 'bg-amber-500/5' : ''"
          >
            <td class="py-1 px-2 text-gray-500 whitespace-nowrap">{{ formatTime(liq.time) }}</td>
            <td class="py-1 px-1 font-bold text-gray-300 whitespace-nowrap">
              {{ liq.symbol.replace('USDT', '') }}
            </td>
            <td class="py-1 px-1 text-center">
              <span
                class="px-1 py-0.2 rounded text-[7.5px] font-bold uppercase tracking-wider"
                :class="liq.side === 'SELL' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                  : 'bg-green-500/20 text-green-400 border border-green-500/40'"
              >
                {{ liq.side === 'SELL' ? 'LONG REKT' : 'SHORT REKT' }}
              </span>
            </td>
            <td class="py-1 px-2 text-right text-gray-300 whitespace-nowrap">
              ${{ liq.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) }}
            </td>
            <td
              class="py-1 px-2 text-right font-bold whitespace-nowrap"
              :class="liq.usdValue >= 50000 ? 'text-amber-400 font-extrabold animate-pulse' : (liq.side === 'SELL' ? 'text-red-400' : 'text-green-400')"
            >
              {{ formatCurrency(liq.usdValue) }}
            </td>
          </tr>
          <tr v-if="liquidations.length === 0">
            <td colspan="5" class="py-8 text-center text-gray-600 text-[10px]">
              Listening to Binance Futures Liquidation stream...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
