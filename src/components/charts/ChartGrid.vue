<!-- src/components/charts/ChartGrid.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import ChartPanel from './ChartPanel.vue';
import draggable from 'vuedraggable';
import { Plus } from 'lucide-vue-next';

const props = defineProps<{
  tabId: string;
}>();

const workspaceStore = useWorkspaceStore();

const activeTab = computed(() => {
  return workspaceStore.tabs.find((t) => t.id === props.tabId)!;
});

const panels = computed({
  get() {
    return activeTab.value?.panels || [];
  },
  set(val) {
    workspaceStore.reorderPanels(props.tabId, val);
  },
});

const gridColsClass = computed(() => {
  const count = panels.value.length + (panels.value.length < 8 ? 1 : 0);
  if (count <= 1) return 'grid-cols-1';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-3';
  return 'grid-cols-4';
});

const gridRowsClass = computed(() => {
  const count = panels.value.length + (panels.value.length < 8 ? 1 : 0);
  if (count <= 2) return 'grid-rows-1';
  return 'grid-rows-2';
});
</script>

<template>
  <div class="w-full h-[calc(100vh-76px)] bg-black p-1">
    <draggable
      v-model="panels"
      item-key="id"
      :class="['grid w-full h-full gap-1', gridColsClass, gridRowsClass]"
      handle=".h-8" 
    >
      <template #item="{ element }">
        <div class="h-full w-full overflow-hidden">
          <ChartPanel :panel-id="element.id" :tab-id="props.tabId" />
        </div>
      </template>
      
      <template #footer>
        <div
          v-if="panels.length < 8"
          @click="workspaceStore.addPanel(props.tabId)"
          class="border border-dashed border-border bg-black/40 hover:bg-surface/50 hover:border-accent-green cursor-pointer flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-white transition-all duration-150 rounded"
        >
          <Plus class="h-5 w-5 text-accent-green" />
          <span class="text-[9px] font-mono tracking-wider font-semibold uppercase">ADD CHART</span>
        </div>
      </template>
    </draggable>
  </div>
</template>
