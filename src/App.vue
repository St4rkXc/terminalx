<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useWorkspaceStore } from './stores/workspace';
import AppHeader from './components/layout/AppHeader.vue';
import TabBar from './components/layout/TabBar.vue';
import DashboardLayout from './components/dashboard/DashboardLayout.vue';
import TestingView from './components/dashboard/TestingView.vue';
import ChartGrid from './components/charts/ChartGrid.vue';
import CompareLayout from './components/charts/CompareLayout.vue';
import FocusedLayout from './components/charts/FocusedLayout.vue';
import SettingsDrawer from './components/ui/SettingsDrawer.vue';
import WorkspaceCreationModal from './components/layout/WorkspaceCreationModal.vue';

const workspaceStore = useWorkspaceStore();
const isSettingsOpen = ref(false);
const showCreationModal = ref(false);

const currentPath = ref(window.location.pathname);

const handlePathChange = () => {
  currentPath.value = window.location.pathname;
  if (currentPath.value === '/testing') {
    workspaceStore.activeTabId = 'testing';
  } else {
    if (workspaceStore.activeTabId === 'testing') {
      workspaceStore.activeTabId = 'dashboard';
    }
  }
};

onMounted(() => {
  workspaceStore.checkAndMigrate();
  if (window.location.pathname === '/testing') {
    workspaceStore.activeTabId = 'testing';
  }
  window.addEventListener('popstate', handlePathChange);
});

onUnmounted(() => {
  window.removeEventListener('popstate', handlePathChange);
});

watch(
  () => workspaceStore.activeTabId,
  (newTabId) => {
    if (newTabId === 'testing') {
      if (window.location.pathname !== '/testing') {
        window.history.pushState({}, '', '/testing');
        currentPath.value = '/testing';
      }
    } else {
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
        currentPath.value = '/';
      }
    }
  }
);

const handleCreateTab = (payload: { name: string; template: any; assetMode: any }) => {
  workspaceStore.createTab(payload.name, 'charts', payload.template, payload.assetMode);
};
</script>

<template>
  <div class="h-screen w-screen bg-black flex flex-col overflow-hidden text-white select-none">
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
          <TestingView v-else-if="tab.type === 'testing'" />
          <ChartGrid v-else-if="tab.template === 'multi'" :tab-id="tab.id" />
          <CompareLayout v-else-if="tab.template === 'compare'" :tab-id="tab.id" />
          <FocusedLayout v-else-if="tab.template === 'focused'" :tab-id="tab.id" />
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
