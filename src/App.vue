<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useWorkspaceStore } from './stores/workspace';
import AppHeader from './components/layout/AppHeader.vue';
import TabBar from './components/layout/TabBar.vue';
import DashboardLayout from './components/dashboard/DashboardLayout.vue';
import ChartGrid from './components/charts/ChartGrid.vue';
import CompareLayout from './components/charts/CompareLayout.vue';
import FocusedLayout from './components/charts/FocusedLayout.vue';
import DetailedLayout from './components/charts/DetailedLayout.vue';
import SettingsDrawer from './components/ui/SettingsDrawer.vue';
import WorkspaceCreationModal from './components/layout/WorkspaceCreationModal.vue';

const workspaceStore = useWorkspaceStore();
const isSettingsOpen = ref(false);
const showCreationModal = ref(false);
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
  workspaceStore.checkAndMigrate();
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const handleCreateTab = (payload: { name: string; template: any }) => {
  workspaceStore.createTab(payload.name, 'charts', payload.template);
};
</script>

<template>
  <!-- Mobile Block Overlay -->
  <div v-if="isMobile" class="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-8 text-center">
    <div class="max-w-md">
      <div class="text-4xl mb-6">📱</div>
      <h1 class="text-2xl font-bold mb-4 text-white uppercase tracking-tight">Desktop Experience Only</h1>
      <p class="text-gray-400 text-lg leading-relaxed">
        Currently Terminal X is not available for mobile. Please use your tablet or desktop for the full high-performance trading experience.
      </p>
    </div>
  </div>

  <div v-else class="h-screen w-screen bg-black flex flex-col overflow-hidden text-white select-none">
    <!-- Header -->
    <AppHeader @toggle-settings="isSettingsOpen = true" />

    <!-- Tab Bar -->
    <TabBar @open-create-modal="showCreationModal = true" />

    <!-- Workspace Area -->
    <main class="flex-1 bg-black overflow-hidden relative">
      <template v-for="tab in workspaceStore.tabs" :key="tab.id">
        <!-- Use v-show to preserve DOM and canvas state on tab switch -->
        <div v-show="workspaceStore.activeTabId === tab.id" class="h-full w-full">
          <DashboardLayout v-if="tab.type === 'dashboard'" />
          <ChartGrid v-else-if="tab.template === 'multi'" :tab-id="tab.id" />
          <CompareLayout v-else-if="tab.template === 'compare'" :tab-id="tab.id" />
          <FocusedLayout v-else-if="tab.template === 'focused'" :tab-id="tab.id" />
          <DetailedLayout v-else-if="tab.template === 'detailed'" :tab-id="tab.id" />
        </div>
      </template>
    </main>

    <!-- Slide-over Settings Drawer -->
    <SettingsDrawer :is-open="isSettingsOpen" @close="isSettingsOpen = false" />

    <!-- Workspace Creation Modal -->
    <WorkspaceCreationModal
      v-model:show="showCreationModal"
      :tab-count="workspaceStore.tabs.length"
      @create="handleCreateTab"
    />
  </div>
</template>
