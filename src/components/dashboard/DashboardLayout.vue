<!-- src/components/dashboard/DashboardLayout.vue -->
<script setup lang="ts">
import MarketOverview from "./MarketOverview.vue";
import OrderBook from "./OrderBook.vue";
import NewsFeed from "./NewsFeed.vue";
import EconomicCalendar from "./EconomicCalendar.vue";
</script>

<template>
  <div class="w-full h-[calc(100vh-76px)] bg-black p-1">
    <div class="grid grid-cols-1 md:grid-cols-2 h-full w-full gap-1">
      <!-- Top Row -->
      <MarketOverview />
      <OrderBook />
      <NewsFeed />
      <EconomicCalendar />
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
