<!-- src/components/highcharts/BlockTradeTracker.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';

const props = defineProps<{
  symbol: string;
  assetMode: 'crypto' | 'stocks';
}>();

interface BlockTrade {
  time: string;
  price: string;
  qty: string;
  usdValue: number;
  isSell: boolean;
  id: number;
}

const blockTrades = ref<BlockTrade[]>([]);
let currentSubscription: string | null = null;
let tradeBuffer: BlockTrade[] = [];
let syncTimer: any = null;

// Threshold in USD/USDT for a trade to be considered a block trade
const usdThreshold = computed(() => {
  const sym = props.symbol.toUpperCase();
  if (sym.startsWith('BTC')) return 10000; // $10k USD for BTC
  if (sym.startsWith('ETH')) return 5000;  // $5k USD for ETH
  return 2000; // $2k USD for others
});

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toTimeString().split(' ')[0] + '.' + String(timestamp % 1000).padStart(3, '0');
};

const handleTradeMessage = (data: any) => {
  if (props.assetMode !== 'crypto') return;

  const price = parseFloat(data.p);
  const qty = parseFloat(data.q);
  const usdValue = price * qty;

  if (usdValue >= usdThreshold.value) {
    const newTrade: BlockTrade = {
      time: formatTime(Number(data.E)),
      price: price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      qty: qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      usdValue,
      isSell: data.m,
      id: data.t
    };

    tradeBuffer.unshift(newTrade);
    if (tradeBuffer.length > 25) {
      tradeBuffer.length = 25;
    }
  }
};

const startSync = () => {
  stopSync();
  syncTimer = setInterval(() => {
    if (tradeBuffer.length > 0) {
      blockTrades.value = [...tradeBuffer];
    }
  }, 500); // Sync to UI every 500ms
};

const stopSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
};

const subscribeToWS = () => {
  unsubscribeFromWS();

  if (props.assetMode !== 'crypto') return;

  const streamName = `${props.symbol.toLowerCase()}@trade`;
  currentSubscription = streamName;
  wsManager.subscribe(streamName, handleTradeMessage);
  startSync();
};

const unsubscribeFromWS = () => {
  stopSync();
  if (currentSubscription) {
    wsManager.unsubscribe(currentSubscription, handleTradeMessage);
    currentSubscription = null;
  }
};

watch(() => props.symbol, () => {
  blockTrades.value = [];
  tradeBuffer = [];
  subscribeToWS();
});

watch(() => props.assetMode, () => {
  blockTrades.value = [];
  tradeBuffer = [];
  if (props.assetMode === 'crypto') {
    subscribeToWS();
  } else {
    unsubscribeFromWS();
  }
});

onMounted(() => {
  subscribeToWS();
});

onUnmounted(() => {
  unsubscribeFromWS();
});
</script>

<template>
  <div class="w-full h-full border border-[#222222] bg-[#000000] rounded p-2 flex flex-col font-mono text-[10px]">
    <div class="flex items-center justify-between border-b border-[#222222] pb-1 mb-1 font-bold text-white uppercase text-[9px] tracking-wider">
      <span>BLOCK TRADE TRACKER</span>
      <span class="text-amber-500">> ${{ usdThreshold.toLocaleString() }}</span>
    </div>
    
    <div class="flex-1 overflow-y-auto scrollbar-thin text-[#cccccc]">
      <div v-if="props.assetMode !== 'crypto'" class="h-full flex items-center justify-center text-center text-gray-500 text-[9px] px-2">
        CRYPTO ONLY FEED
      </div>
      <div v-else-if="blockTrades.length === 0" class="h-full flex items-center justify-center text-center text-gray-500 text-[9px]">
        WAITING FOR LARGE TRADES...
      </div>
      <table v-else class="w-full text-left">
        <thead>
          <tr class="text-gray-500 border-b border-[#111111] font-normal">
            <th class="py-1">TIME</th>
            <th class="py-1 text-right">PRICE</th>
            <th class="py-1 text-right">QTY</th>
            <th class="py-1 text-right">VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="trade in blockTrades" 
            :key="trade.id" 
            class="hover:bg-[#111111] transition-colors border-b border-[#111111]/30 font-bold"
            :class="trade.isSell ? 'text-red-500' : 'text-green-500'"
          >
            <td class="py-0.5 text-gray-400 font-normal">{{ trade.time }}</td>
            <td class="py-0.5 text-right">{{ trade.price }}</td>
            <td class="py-0.5 text-right text-gray-300">{{ trade.qty }}</td>
            <td class="py-0.5 text-right font-mono">${{ Math.round(trade.usdValue).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #222;
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #333;
}
</style>
