<!-- src/components/highcharts/LiquidationFeed.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  symbol: string;
}>();

interface Liquidation {
  time: string;
  price: number;
  qty: number;
  usdValue: number;
  side: 'BUY' | 'SELL'; // BUY = Short Liquidation, SELL = Long Liquidation
  id: number;
}

const liquidations = ref<Liquidation[]>([]);
let ws: WebSocket | null = null;
let buffer: Liquidation[] = [];
let syncTimer: any = null;
let reconnectTimeout: any = null;

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toTimeString().split(' ')[0] + '.' + String(timestamp % 1000).padStart(3, '0');
};

const handleMessage = (event: MessageEvent) => {
  try {
    const payload = JSON.parse(event.data);
    const data = payload.o ? payload : payload.data;
    if (!data || data.e !== 'forceOrder' || !data.o) return;

    const price = parseFloat(data.o.p);
    const qty = parseFloat(data.o.q);
    const usdValue = price * qty;

    const newLiq: Liquidation = {
      time: formatTime(Number(data.E)),
      price,
      qty,
      usdValue,
      side: data.o.S,
      id: data.E + Math.random(),
    };

    buffer.unshift(newLiq);
    if (buffer.length > 50) {
      buffer.length = 50;
    }
  } catch (err) {
    console.error('[LiquidationFeed] Parse error:', err);
  }
};

const connect = () => {
  disconnect();
  
  const streamUrl = `wss://fstream.binance.com/ws/${props.symbol.toLowerCase()}@forceOrder`;
  ws = new WebSocket(streamUrl);

  ws.onmessage = handleMessage;

  ws.onclose = () => {
    ws = null;
    reconnectTimeout = setTimeout(connect, 3000);
  };

  ws.onerror = (err) => {
    console.error('[LiquidationFeed] WebSocket error:', err);
    if (ws) {
      ws.close();
    }
  };
};

const disconnect = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
};

const startSync = () => {
  stopSync();
  syncTimer = setInterval(() => {
    if (buffer.length > 0) {
      liquidations.value = [...buffer];
    }
  }, 500);
};

const stopSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
};

watch(() => props.symbol, () => {
  liquidations.value = [];
  buffer = [];
  connect();
});

onMounted(() => {
  connect();
  startSync();
});

onUnmounted(() => {
  disconnect();
  stopSync();
});
</script>

<template>
  <div class="w-full h-full border border-[#222222] bg-[#000000] rounded p-2 flex flex-col font-mono text-[10px]">
    <div class="flex items-center justify-between border-b border-[#222222] pb-1 mb-1 font-bold text-white uppercase text-[9px] tracking-wider">
      <span>LIQUIDATION FEED</span>
      <span class="text-accent-red uppercase animate-pulse">FUTURES LIVE</span>
    </div>
    
    <div class="flex-1 overflow-y-auto scrollbar-thin text-[#cccccc]">
      <div v-if="liquidations.length === 0" class="h-full flex items-center justify-center text-center text-gray-500 text-[9px]">
        WAITING FOR LIQUIDATIONS...
      </div>
      <table v-else class="w-full text-left">
        <thead>
          <tr class="text-gray-500 border-b border-[#111111] font-normal">
            <th class="py-1">TIME</th>
            <th class="py-1">SIDE</th>
            <th class="py-1 text-right">PRICE</th>
            <th class="py-1 text-right">QTY</th>
            <th class="py-1 text-right">VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="liq in liquidations" 
            :key="liq.id" 
            class="hover:bg-[#111111] transition-colors border-b border-[#111111]/30 font-bold"
            :class="liq.side === 'SELL' ? 'text-red-500' : 'text-green-500'"
          >
            <td class="py-0.5 text-gray-400 font-normal">{{ liq.time }}</td>
            <td class="py-0.5 font-bold">
              {{ liq.side === 'SELL' ? 'LONG REKT' : 'SHORT REKT' }}
            </td>
            <td class="py-0.5 text-right text-white">
              {{ liq.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </td>
            <td class="py-0.5 text-right text-gray-300">
              {{ liq.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) }}
            </td>
            <td class="py-0.5 text-right font-mono font-bold">
              ${{ Math.round(liq.usdValue).toLocaleString() }}
            </td>
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
