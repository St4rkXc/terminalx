<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useWorkspaceStore } from './stores/workspace';
import AppHeader from './components/layout/AppHeader.vue';
import TabBar from './components/layout/TabBar.vue';
import DashboardLayout from './components/dashboard/DashboardLayout.vue';
import ChartGrid from './components/charts/ChartGrid.vue';
import SettingsDrawer from './components/ui/SettingsDrawer.vue';

const workspaceStore = useWorkspaceStore();
const isSettingsOpen = ref(false);
</script>

<template>
  <div class="h-screen w-screen bg-black flex flex-col overflow-hidden text-white select-none">
    <!-- Header -->
    <AppHeader @toggle-settings="isSettingsOpen = true" />

    <!-- Tab Bar -->
    <TabBar />

    <!-- Workspace Area -->
    <main class="flex-1 bg-black overflow-hidden relative">
      <template v-for="tab in workspaceStore.tabs" :key="tab.id">
        <!-- Use v-show to preserve DOM and canvas state on tab switch -->
        <div v-show="workspaceStore.activeTabId === tab.id" class="h-full w-full">
          <DashboardLayout v-if="tab.type === 'dashboard'" />
          <ChartGrid v-else :tab-id="tab.id" />
        </div>
      </template>
    </main>

    <!-- Slide-over Settings Drawer -->
    <SettingsDrawer :is-open="isSettingsOpen" @close="isSettingsOpen = false" />
  </div>
</template>
