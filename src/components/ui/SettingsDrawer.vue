<!-- src/components/ui/SettingsDrawer.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { X, Eye, EyeOff } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const settings = useSettingsStore();

const showFinnhub = ref(false);
const showFmp = ref(false);
const showPolygon = ref(false);

const localFinnhub = ref(settings.finnhubApiKey);
const localFmp = ref(settings.fmpApiKey);
const localPolygon = ref(settings.polygonApiKey);

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    localFinnhub.value = settings.finnhubApiKey;
    localFmp.value = settings.fmpApiKey;
    localPolygon.value = settings.polygonApiKey;
  }
});

const saveSettings = () => {
  settings.saveKeys({
    finnhub: localFinnhub.value,
    fmp: localFmp.value,
    polygon: localPolygon.value,
  });
};
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
      <!-- API Keys -->
      <div class="space-y-3">
        <span class="text-accent-green font-bold uppercase tracking-wider block mb-1">
          API Keys Configuration
        </span>

        <!-- Finnhub -->
        <div class="space-y-1.5">
          <label class="text-[10px] text-gray-500 uppercase font-semibold">
            Finnhub (General News)
          </label>
          <div class="relative flex items-center">
            <input
              :type="showFinnhub ? 'text' : 'password'"
              v-model="localFinnhub"
              @blur="saveSettings"
              placeholder="Enter Finnhub API Key"
              class="w-full bg-black border border-border rounded px-2.5 py-1.5 text-white placeholder-gray-600 focus:border-accent-green focus:outline-none"
            />
            <button
              @click="showFinnhub = !showFinnhub"
              type="button"
              class="absolute right-2 text-gray-500 hover:text-white"
            >
              <Eye v-if="!showFinnhub" class="h-3.5 w-3.5" />
              <EyeOff v-else class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- FMP -->
        <div class="space-y-1.5">
          <label class="text-[10px] text-gray-500 uppercase font-semibold">
            Financial Modeling Prep (Calendar)
          </label>
          <div class="relative flex items-center">
            <input
              :type="showFmp ? 'text' : 'password'"
              v-model="localFmp"
              @blur="saveSettings"
              placeholder="Enter FMP API Key"
              class="w-full bg-black border border-border rounded px-2.5 py-1.5 text-white placeholder-gray-600 focus:border-accent-green focus:outline-none"
            />
            <button
              @click="showFmp = !showFmp"
              type="button"
              class="absolute right-2 text-gray-500 hover:text-white"
            >
              <Eye v-if="!showFmp" class="h-3.5 w-3.5" />
              <EyeOff v-else class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Polygon -->
        <div class="space-y-1.5">
          <label class="text-[10px] text-gray-500 uppercase font-semibold">
            Polygon.io (Equities)
          </label>
          <div class="relative flex items-center">
            <input
              :type="showPolygon ? 'text' : 'password'"
              v-model="localPolygon"
              @blur="saveSettings"
              placeholder="Enter Polygon.io Key"
              class="w-full bg-black border border-border rounded px-2.5 py-1.5 text-white placeholder-gray-600 focus:border-accent-green focus:outline-none"
            />
            <button
              @click="showPolygon = !showPolygon"
              type="button"
              class="absolute right-2 text-gray-500 hover:text-white"
            >
              <Eye v-if="!showPolygon" class="h-3.5 w-3.5" />
              <EyeOff v-else class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div class="h-[1px] bg-border my-2"></div>

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

      <!-- Defaults Settings -->
      <div class="space-y-3">
        <span class="text-accent-green font-bold uppercase tracking-wider block">
          Default Options
        </span>
        
        <div class="flex flex-col space-y-1">
          <label class="text-[10px] text-gray-500 uppercase font-semibold">
            Default Chart Symbol
          </label>
          <input
            v-model="settings.defaultSymbol"
            class="bg-black border border-border rounded px-2 py-1 focus:border-accent-green focus:outline-none text-white font-mono"
          />
        </div>

        <div class="flex flex-col space-y-1">
          <label class="text-[10px] text-gray-500 uppercase font-semibold">
            Order Book Symbol
          </label>
          <input
            v-model="settings.orderBookSymbol"
            class="bg-black border border-border rounded px-2 py-1 focus:border-accent-green focus:outline-none text-white font-mono"
          />
        </div>
      </div>
    </div>
  </div>
</template>
