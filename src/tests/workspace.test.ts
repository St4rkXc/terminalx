import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWorkspaceStore } from '../stores/workspace';

describe('Workspace Store - Scalper Template', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default dashboard and chart tabs', () => {
    const store = useWorkspaceStore();
    expect(store.tabs.length).toBe(2);
    expect(store.tabs[0].type).toBe('dashboard');
  });

  it('should create a new workspace tab with scalper template and 1m interval', () => {
    const store = useWorkspaceStore();
    store.createTab('Futures Scalper Room', 'charts', 'scalper');

    const createdTab = store.tabs.find((t) => t.name === 'Futures Scalper Room');
    expect(createdTab).toBeDefined();
    expect(createdTab?.template).toBe('scalper');
    expect(createdTab?.panels.length).toBe(1);
    expect(createdTab?.panels[0].interval).toBe('1m');
    expect(store.activeTabId).toBe(createdTab?.id);
  });
});
