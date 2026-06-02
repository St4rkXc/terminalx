<!-- src/components/charts/FocusedMiniWidgets.vue -->
<script setup lang="ts">
import OrderBook from '../dashboard/OrderBook.vue';
import RecentTrades from '../dashboard/RecentTrades.vue';

const props = defineProps<{
  symbol: string;
}>();
</script>

<template>
  <div class="h-full w-full flex flex-col gap-1">
    <!-- Top Widget: Compact OrderBook -->
    <div class="flex-[3] min-h-0 overflow-hidden">
      <OrderBook :symbol="props.symbol" :compact="true" />
    </div>

    <!-- Bottom Widget: RecentTrades Feed -->
    <div class="flex-[2] min-h-0 overflow-hidden">
      <RecentTrades :symbol="props.symbol" />
    </div>
  </div>
</template>
