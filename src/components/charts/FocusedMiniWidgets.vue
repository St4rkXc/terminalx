<!-- src/components/charts/FocusedMiniWidgets.vue -->
<script setup lang="ts">
import OrderBook from '../dashboard/OrderBook.vue';
import RecentTrades from '../dashboard/RecentTrades.vue';
import { AssetMode } from '../../types';

const props = defineProps<{
  symbol: string;
  assetMode: AssetMode;
}>();
</script>

<template>
  <div class="h-full w-full flex flex-col gap-1">
    <!-- Top Widget: Compact OrderBook -->
    <div class="flex-[3] min-h-0 overflow-hidden">
      <OrderBook :symbol="props.symbol" :asset-mode="props.assetMode" :compact="true" />
    </div>

    <!-- Bottom Widget: RecentTrades Feed -->
    <div class="flex-[2] min-h-0 overflow-hidden">
      <RecentTrades :symbol="props.symbol" :asset-mode="props.assetMode" />
    </div>
  </div>
</template>
