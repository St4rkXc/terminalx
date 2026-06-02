<!-- src/components/ui/SettingsDrawer.vue -->
<script setup lang="ts">
import { useSettingsStore } from '../../stores/settings';
import { X } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const settings = useSettingsStore();
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      @click="$emit('close')"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    ></div>
  </Transition>

  <div
    class="fixed right-0 top-0 bottom-0 z-50 w-80 border-l border-border bg-panel text-white shadow-2xl transition-transform duration-200 ease-in-out select-none"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <div class="h-10 border-b border-border flex items-center justify-between px-4">
      <span class="font-mono text-xs font-bold tracking-wider text-gray-400">
        SYSTEM SETTINGS
      </span>
      <button
        @click="$emit('close')"
        class="text-gray-500 hover:text-white p-1 rounded hover:bg-surface"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div class="p-4 space-y-5 overflow-y-auto h-[calc(100%-40px)] font-mono text-xs text-gray-300">
      <!-- Accent Color Selection -->
      <div class="space-y-2">
        <span class="text-accent-green font-bold uppercase tracking-wider block">
          Interface Accent
        </span>
        <div class="flex items-center space-x-2">
          <button
            v-for="color in ['#00ff88', '#3b82f6', '#8b5cf6', '#f59e0b', '#ff4444']"
            :key="color"
            @click="settings.updateSettings({ accentColor: color })"
            class="h-6 w-6 rounded-full border border-border focus:outline-none relative transition-transform hover:scale-110"
            :style="{ backgroundColor: color }"
          >
            <span
              v-if="settings.accentColor === color"
              class="absolute inset-1 rounded-full border-2 border-black"
            ></span>
          </button>
        </div>
      </div>

      <div class="h-[1px] bg-border my-2"></div>
    </div>
  </div>
</template>
