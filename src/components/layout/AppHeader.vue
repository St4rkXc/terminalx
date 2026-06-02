<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { wsManager } from '../../composables/useWebSocketManager';
import { Settings } from 'lucide-vue-next';

defineEmits<{
  (e: 'toggle-settings'): void;
}>();

const timeString = ref('');
let timer: any = null;

const updateTime = () => {
  const now = new Date();
  timeString.value = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const wsStatus = wsManager.connectionStatus;
</script>

<template>
  <header class="h-10 border-b border-border bg-black flex items-center justify-between px-4 select-none">
    <div class="flex items-center space-x-3">
      <span class="font-mono font-bold tracking-wider text-sm">
        TERMINAL<span class="text-accent-green">X</span>
      </span>
      <div class="h-4 w-[1px] bg-border"></div>
      <div class="flex items-center space-x-2 text-[10px] text-gray-500 font-mono mr-2">
        <span
          class="h-2 w-2 rounded-full inline-block"
          :class="{
            'bg-accent-green animate-pulse': wsStatus === 'online',
            'bg-accent-orange animate-pulse': wsStatus === 'connecting',
            'bg-accent-red': wsStatus === 'offline'
          }"
        ></span>
        <span class="uppercase tracking-wider mr-1">{{ wsStatus }}</span>
      </div>
    </div>
    
    <div class="flex items-center space-x-4">
      <div class="font-mono text-xs text-gray-400 tracking-widest font-medium">
        {{ timeString }}
      </div>
      <button
        @click="$emit('toggle-settings')"
        class="text-gray-400 hover:text-white transition-colors duration-150 p-1 rounded hover:bg-surface"
        title="Settings"
      >
        <Settings class="h-4 w-4" />
      </button>
    </div>
  </header>
</template>
