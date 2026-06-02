<!-- src/components/layout/WorkspaceCreationModal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { LayoutGrid, Columns2, Maximize2, Coins, ArrowUpRight, X } from 'lucide-vue-next';
import { WorkspaceTemplate, AssetMode } from '../../types';

const props = defineProps<{
  show: boolean;
  tabCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'create', payload: { name: string; template: WorkspaceTemplate; assetMode: AssetMode }): void;
}>();

const selectedTemplate = ref<WorkspaceTemplate>('multi');
const selectedAssetMode = ref<AssetMode>('crypto');
const workspaceName = ref('');

// Auto-generate name when modal opens
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      const templateName = selectedTemplate.value === 'multi' 
        ? 'Multi Chart' 
        : selectedTemplate.value === 'compare' 
          ? 'Compare' 
          : 'Focused';
      const assetLabel = selectedAssetMode.value === 'stocks' ? 'Stocks' : 'Crypto';
      workspaceName.value = `${assetLabel} ${templateName} ${props.tabCount}`;
    }
  }
);

// Keep name in sync with choices unless edited
const updateDefaultName = () => {
  const templateName = selectedTemplate.value === 'multi' 
    ? 'Multi' 
    : selectedTemplate.value === 'compare' 
      ? 'Compare' 
      : 'Focused';
  const assetLabel = selectedAssetMode.value === 'stocks' ? 'Stocks' : 'Crypto';
  workspaceName.value = `${assetLabel} ${templateName} ${props.tabCount}`;
};

watch([selectedTemplate, selectedAssetMode], () => {
  updateDefaultName();
});

const handleCreate = () => {
  const name = workspaceName.value.trim();
  if (name.length === 0) return;
  emit('create', {
    name,
    template: selectedTemplate.value,
    assetMode: selectedAssetMode.value,
  });
  emit('update:show', false);
};

const handleClose = () => {
  emit('update:show', false);
};
</script>

<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
      @click.self="handleClose"
    >
      <div class="bg-[#0c0c0c] border border-border w-full max-w-lg rounded-md shadow-2xl flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="h-12 border-b border-border bg-[#050505] flex items-center justify-between px-4">
          <span class="text-xs font-bold tracking-widest text-accent-green uppercase flex items-center space-x-1.5">
            <span class="inline-block h-2 w-2 rounded-full bg-accent-green animate-pulse"></span>
            <span>Initialize Workspace Tab</span>
          </span>
          <button
            @click="handleClose"
            class="text-gray-500 hover:text-white transition-colors duration-150 p-1 hover:bg-surface rounded"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-6">
          <!-- Template Selection -->
          <div class="space-y-2">
            <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              1. Select Layout Template
            </label>
            <div class="grid grid-cols-1 gap-2.5">
              <!-- Multi Chart -->
              <div
                @click="selectedTemplate = 'multi'"
                class="border rounded p-3 flex items-start space-x-3 cursor-pointer transition-all duration-150"
                :class="selectedTemplate === 'multi' 
                  ? 'border-accent-green bg-accent-green/5 shadow-[0_0_12px_rgba(0,255,136,0.06)]' 
                  : 'border-border bg-panel hover:border-gray-500 hover:bg-[#141414]'"
              >
                <div 
                  class="p-2 rounded"
                  :class="selectedTemplate === 'multi' ? 'text-accent-green' : 'text-gray-500'"
                >
                  <LayoutGrid class="h-5 w-5" />
                </div>
                <div class="flex-1 space-y-0.5 text-left">
                  <div class="text-[11px] font-bold" :class="selectedTemplate === 'multi' ? 'text-white' : 'text-gray-300'">
                    Multi Chart
                  </div>
                  <div class="text-[9px] text-gray-500 leading-normal">
                    Free-form grid interface. Build up to 8 chart tiles to monitor multiple parameters simultaneously.
                  </div>
                </div>
              </div>

              <!-- Compare -->
              <div
                @click="selectedTemplate = 'compare'"
                class="border rounded p-3 flex items-start space-x-3 cursor-pointer transition-all duration-150"
                :class="selectedTemplate === 'compare' 
                  ? 'border-accent-green bg-accent-green/5 shadow-[0_0_12px_rgba(0,255,136,0.06)]' 
                  : 'border-border bg-panel hover:border-gray-500 hover:bg-[#141414]'"
              >
                <div 
                  class="p-2 rounded"
                  :class="selectedTemplate === 'compare' ? 'text-accent-green' : 'text-gray-500'"
                >
                  <Columns2 class="h-5 w-5" />
                </div>
                <div class="flex-1 space-y-0.5 text-left">
                  <div class="text-[11px] font-bold" :class="selectedTemplate === 'compare' ? 'text-white' : 'text-gray-300'">
                    Compare (Side-by-Side)
                  </div>
                  <div class="text-[9px] text-gray-500 leading-normal">
                    Couples 2 asset charts together with a central, shared order book. Ideal for arbitrage or correlation tracking.
                  </div>
                </div>
              </div>

              <!-- Focused -->
              <div
                @click="selectedTemplate = 'focused'"
                class="border rounded p-3 flex items-start space-x-3 cursor-pointer transition-all duration-150"
                :class="selectedTemplate === 'focused' 
                  ? 'border-accent-green bg-accent-green/5 shadow-[0_0_12px_rgba(0,255,136,0.06)]' 
                  : 'border-border bg-panel hover:border-gray-500 hover:bg-[#141414]'"
              >
                <div 
                  class="p-2 rounded"
                  :class="selectedTemplate === 'focused' ? 'text-accent-green' : 'text-gray-500'"
                >
                  <Maximize2 class="h-5 w-5" />
                </div>
                <div class="flex-1 space-y-0.5 text-left">
                  <div class="text-[11px] font-bold" :class="selectedTemplate === 'focused' ? 'text-white' : 'text-gray-300'">
                    Focused Ticker View
                  </div>
                  <div class="text-[9px] text-gray-500 leading-normal">
                    Single asset focus. Integrates 1 primary chart alongside real-time order ladder and raw trade feed.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Asset Type Mode Selection -->
          <div class="space-y-2">
            <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              2. Select Ticker Asset Class
            </label>
            <div class="flex space-x-2">
              <button
                type="button"
                @click="selectedAssetMode = 'stocks'"
                class="flex-1 border rounded py-2 px-4 transition-all duration-150 flex items-center justify-center space-x-2 text-[10px] font-bold"
                :class="selectedAssetMode === 'stocks'
                  ? 'border-accent-green bg-accent-green/5 text-white'
                  : 'border-border bg-panel text-gray-500 hover:text-gray-300 hover:border-gray-600'"
              >
                <ArrowUpRight class="h-3.5 w-3.5" />
                <span>STOCKS (FINNHUB / POLYGON)</span>
              </button>
              <button
                type="button"
                @click="selectedAssetMode = 'crypto'"
                class="flex-1 border rounded py-2 px-4 transition-all duration-150 flex items-center justify-center space-x-2 text-[10px] font-bold"
                :class="selectedAssetMode === 'crypto'
                  ? 'border-accent-green bg-accent-green/5 text-white'
                  : 'border-border bg-panel text-gray-500 hover:text-gray-300 hover:border-gray-600'"
              >
                <Coins class="h-3.5 w-3.5" />
                <span>CRYPTO (BINANCE WEBSOCKETS)</span>
              </button>
            </div>
          </div>

          <!-- Workspace Name -->
          <div class="space-y-2 text-left">
            <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              3. Workspace Identifier / Name
            </label>
            <input
              v-model="workspaceName"
              placeholder="e.g. BTC Macro Desk"
              class="w-full bg-[#050505] border border-border rounded px-3 py-2 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-accent-green focus:shadow-[0_0_8px_rgba(0,255,136,0.1)] transition-all font-mono"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="h-14 border-t border-border bg-[#050505] flex items-center justify-end px-4 space-x-2.5">
          <button
            @click="handleClose"
            class="px-4 py-1.5 rounded text-[10px] font-bold text-gray-500 hover:text-white hover:bg-surface border border-transparent transition-all uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            @click="handleCreate"
            :disabled="workspaceName.trim().length === 0"
            class="px-5 py-1.5 rounded text-[10px] font-bold bg-accent-green text-black hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center space-x-1"
          >
            <span>Initialize Desk</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
