<!-- src/components/dashboard/DashboardLayout.vue -->
<script setup lang="ts">
import MarketOverview from './MarketOverview.vue';
import OrderBook from './OrderBook.vue';
import NewsFeed from './NewsFeed.vue';
import EconomicCalendar from './EconomicCalendar.vue';
</script>

<template>
  <div class="w-full h-[calc(100vh-76px)] bg-black p-1">
    <div class="grid grid-cols-1 md:grid-cols-2 h-full w-full gap-1">
      <!-- Top Row -->
      <div class="grid grid-rows-1 h-full w-full gap-1 md:col-span-2 md:grid-cols-2">
        <div class="h-full w-full overflow-hidden">
          <MarketOverview />
        </div>
        <div class="h-full w-full overflow-hidden">
          <OrderBook />
        </div>
      </div>
      <!-- Bottom Row -->
      <div class="grid grid-rows-1 h-full w-full gap-1 md:col-span-2 md:grid-cols-2">
        <div class="h-full w-full overflow-hidden">
          <NewsFeed />
        </div>
        <div class="h-full w-full overflow-hidden">
          <EconomicCalendar />
        </div>
      </div>
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
