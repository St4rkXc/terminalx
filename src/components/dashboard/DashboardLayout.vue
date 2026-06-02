<script setup lang="ts">
import MarketOverview from "./MarketOverview.vue";
import OrderBook from "./OrderBook.vue";
import RecentTrades from "./RecentTrades.vue";
import { useSettingsStore } from "../../stores/settings";

const settings = useSettingsStore();
</script>

<template>
  <div class="w-full h-[calc(100vh-76px)] bg-black p-1">
    <div class="grid grid-cols-1 md:grid-cols-2 h-full w-full gap-1">
      <MarketOverview />
      <OrderBook :symbol="settings.orderBookSymbol" asset-mode="crypto" :allow-mode-switch="false" />
      <RecentTrades :symbol="settings.orderBookSymbol" asset-mode="crypto" />
      <OrderBook symbol="ETHUSDT" asset-mode="crypto" :allow-mode-switch="false" />
    </div>
  </div>
</template>

<style scoped>
/* Keep 2x2 grid responsive and full height */
@media (min-width: 768px) {
  .grid {
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }
}
</style>

