<!-- src/components/charts/FocusedLayout.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import ChartPanel from './ChartPanel.vue';
import FocusedMiniWidgets from './FocusedMiniWidgets.vue';
import { Plus } from 'lucide-vue-next';

const props = defineProps<{
  tabId: string;
}>();

const workspaceStore = useWorkspaceStore();

const activeTab = computed(() => {
  return workspaceStore.tabs.find((t) => t.id === props.tabId)!;
});

const panels = computed(() => {
  return activeTab.value?.panels || [];
});
</script>

<template>
  <div class="w-full h-[calc(100vh-76px)] bg-black p-1 flex gap-1">
    <!-- Placeholder if no panels are found -->
    <div
      v-if="panels.length === 0"
      @click="workspaceStore.addPanel(props.tabId)"
      class="flex-1 border border-dashed border-border bg-black/40 hover:bg-surface/50 hover:border-accent-green cursor-pointer flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-white transition-all duration-150 rounded"
    >
      <Plus class="h-5 w-5 text-accent-green" />
      <span class="text-[9px] font-mono tracking-wider font-semibold uppercase">INITIALIZE CHART</span>
    </div>

    <template v-else>
      <!-- Main Chart Area (60% Width) -->
      <div class="flex-[3] h-full overflow-hidden">
        <ChartPanel :panel-id="panels[0].id" :tab-id="props.tabId" />
      </div>

      <!-- Sidebar Area (40% Width) -->
      <div class="flex-[2] h-full overflow-hidden">
        <FocusedMiniWidgets :symbol="panels[0].symbol" :asset-mode="activeTab.assetMode" />
      </div>
    </template>
  </div>
</template>
