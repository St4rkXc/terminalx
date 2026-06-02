<!-- src/components/layout/TabBar.vue -->
<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import { Plus, X } from 'lucide-vue-next';

const store = useWorkspaceStore();

const editingTabId = ref<string | null>(null);
const editName = ref('');
const activeContextMenuTabId = ref<string | null>(null);
const contextMenuPos = ref({ x: 0, y: 0 });

const startRename = (tabId: string, name: string) => {
  editingTabId.value = tabId;
  editName.value = name;
  nextTick(() => {
    const input = document.getElementById(`tab-input-${tabId}`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const saveRename = (tabId: string) => {
  if (!editingTabId.value) return;
  const name = editName.value.trim();
  if (name.length > 0 && name.length <= 30) {
    store.renameTab(tabId, name);
  }
  editingTabId.value = null;
};

const cancelRename = () => {
  editingTabId.value = null;
};

const openContextMenu = (event: MouseEvent, tabId: string) => {
  event.preventDefault();
  activeContextMenuTabId.value = tabId;
  contextMenuPos.value = { x: event.clientX, y: event.clientY };
  
  // Register click listener to close context menu
  nextTick(() => {
    document.addEventListener('click', closeContextMenu);
  });
};

const closeContextMenu = () => {
  activeContextMenuTabId.value = null;
  document.removeEventListener('click', closeContextMenu);
};

const emit = defineEmits<{
  (e: 'open-create-modal'): void;
}>();

const handleCreateTab = () => {
  if (store.tabs.length >= 10) return;
  emit('open-create-modal');
};
</script>

<template>
  <div class="h-9 border-b border-border bg-black flex items-center justify-between pr-4 select-none relative">
    <div class="flex items-center h-full overflow-x-auto no-scrollbar max-w-[calc(100%-80px)]">
      <div
        v-for="tab in store.tabs"
        :key="tab.id"
        @click="store.activeTabId = tab.id"
        @contextmenu="openContextMenu($event, tab.id)"
        class="h-full border-r border-border flex items-center px-4 space-x-2 cursor-pointer transition-colors duration-150 relative text-[11px] font-mono select-none"
        :class="[
          store.activeTabId === tab.id
            ? 'bg-panel text-white border-b border-b-accent-green'
            : 'text-gray-500 hover:text-gray-300 hover:bg-surface'
        ]"
      >
        <span
          v-if="tab.type === 'charts' && tab.panels.length > 0"
          class="h-1.5 w-1.5 rounded-full bg-accent-green inline-block animate-pulse"
        ></span>
        
        <input
          v-if="editingTabId === tab.id"
          :id="`tab-input-${tab.id}`"
          v-model="editName"
          @blur="saveRename(tab.id)"
          @keydown.enter="saveRename(tab.id)"
          @keydown.esc="cancelRename"
          class="bg-black text-white px-1 border border-accent-green focus:outline-none w-24 text-[11px]"
        />
        <span
          v-else
          @dblclick="tab.id !== 'dashboard' && startRename(tab.id, tab.name)"
          class="font-medium truncate max-w-[100px]"
        >
          {{ tab.name }}
        </span>

        <button
          v-if="tab.id !== 'dashboard'"
          @click.stop="store.deleteTab(tab.id)"
          class="p-0.5 rounded text-gray-500 hover:text-white hover:bg-surface transition-colors"
        >
          <X class="h-3 w-3" />
        </button>
      </div>

      <button
        v-if="store.tabs.length < 10"
        @click="handleCreateTab"
        class="h-full px-3 flex items-center text-gray-500 hover:text-white hover:bg-panel border-r border-border transition-colors duration-150"
        title="Add workspace tab (Max 10)"
      >
        <Plus class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- Context Menu -->
    <div
      v-if="activeContextMenuTabId !== null"
      :style="{ top: `${contextMenuPos.y}px`, left: `${contextMenuPos.x}px` }"
      class="fixed z-50 bg-surface border border-border rounded shadow-lg py-1 w-32 text-[11px] font-mono text-gray-300"
    >
      <button
        v-if="activeContextMenuTabId !== 'dashboard'"
        @click="startRename(activeContextMenuTabId, store.tabs.find(t => t.id === activeContextMenuTabId)?.name || '')"
        class="w-full text-left px-3 py-1.5 hover:bg-panel hover:text-white transition-colors"
      >
        Rename
      </button>
      <button
        @click="store.duplicateTab(activeContextMenuTabId)"
        class="w-full text-left px-3 py-1.5 hover:bg-panel hover:text-white transition-colors"
      >
        Duplicate
      </button>
      <button
        v-if="activeContextMenuTabId !== 'dashboard'"
        @click="store.deleteTab(activeContextMenuTabId)"
        class="w-full text-left px-3 py-1.5 hover:bg-panel text-accent-red hover:text-accent-red transition-colors"
      >
        Delete
      </button>
    </div>
  </div>
</template>
