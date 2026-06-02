import { defineStore } from 'pinia';
import { Tab, Panel, Interval, ChartType, Exchange, WorkspaceTemplate, AssetMode } from '../types';

export const useWorkspaceStore = defineStore('workspace', {
  state: () => {
    const defaultDashboardTab: Tab = {
      id: 'dashboard',
      name: 'Dashboard',
      type: 'dashboard',
      template: 'multi',
      assetMode: 'stocks',
      panels: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const defaultChartTab: Tab = {
      id: 'workspace-1',
      name: 'Stock Workspace',
      type: 'charts',
      template: 'multi',
      assetMode: 'stocks',
      panels: [
        {
          id: 'panel-default',
          tabId: 'workspace-1',
          symbol: 'AAPL',
          exchange: 'polygon' as Exchange,
          interval: '1d' as Interval,
          chartType: 'candlestick' as ChartType,
          position: 0,
          showVolume: true,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return {
      tabs: [defaultDashboardTab, defaultChartTab] as Tab[],
      activeTabId: 'dashboard',
    };
  },
  actions: {
    checkAndMigrate() {
      // Filter out any deprecated testing tabs from local storage
      this.tabs = this.tabs.filter((tab) => tab.type !== 'testing');

      // Migrate legacy tabs missing template and assetMode fields
      this.tabs = this.tabs.map((tab) => {
        if (!tab.template) {
          tab.template = 'multi';
        }
        if (!tab.assetMode) {
          tab.assetMode = 'stocks';
        }
        if (tab.template === 'compare' && tab.compareSplitPct === undefined) {
          tab.compareSplitPct = 70;
        }
        return tab;
      });
    },
    createTab(
      name: string,
      type: 'dashboard' | 'charts',
      template: WorkspaceTemplate = 'multi',
      assetMode: AssetMode = 'crypto'
    ) {
      const id = crypto.randomUUID();
      const isStocks = assetMode === 'stocks';
      const defaultSym = isStocks ? 'AAPL' : 'BTCUSDT';
      const defaultEx = isStocks ? 'polygon' : 'binance';
      const defaultInt = isStocks ? '1d' : '1h';

      let panels: Panel[] = [];
      if (type === 'charts') {
        if (template === 'multi') {
          panels = [
            {
              id: crypto.randomUUID(),
              tabId: id,
              symbol: defaultSym,
              exchange: defaultEx as Exchange,
              interval: defaultInt as Interval,
              chartType: 'candlestick',
              position: 0,
              showVolume: true,
            },
          ];
        } else if (template === 'compare') {
          const secondSym = isStocks ? 'MSFT' : 'ETHUSDT';
          panels = [
            {
              id: crypto.randomUUID(),
              tabId: id,
              symbol: defaultSym,
              exchange: defaultEx as Exchange,
              interval: defaultInt as Interval,
              chartType: 'candlestick',
              position: 0,
              showVolume: true,
            },
            {
              id: crypto.randomUUID(),
              tabId: id,
              symbol: secondSym,
              exchange: defaultEx as Exchange,
              interval: defaultInt as Interval,
              chartType: 'candlestick',
              position: 1,
              showVolume: true,
            },
          ];
        } else if (template === 'focused') {
          panels = [
            {
              id: crypto.randomUUID(),
              tabId: id,
              symbol: defaultSym,
              exchange: defaultEx as Exchange,
              interval: defaultInt as Interval,
              chartType: 'candlestick',
              position: 0,
              showVolume: true,
            },
          ];
        }
      }

      const newTab: Tab = {
        id,
        name,
        type,
        template,
        assetMode,
        panels,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.tabs.push(newTab);
      this.activeTabId = id;
    },
    deleteTab(id: string) {
      if (id === 'dashboard') return; // Cannot delete dashboard
      const index = this.tabs.findIndex((t) => t.id === id);
      if (index === -1) return;

      // If we delete the active tab, switch active tab to another tab
      if (this.activeTabId === id) {
        const fallbackIndex = index > 0 ? index - 1 : index + 1;
        if (fallbackIndex < this.tabs.length) {
          this.activeTabId = this.tabs[fallbackIndex].id;
        } else {
          this.activeTabId = 'dashboard';
        }
      }
      this.tabs.splice(index, 1);
    },
    renameTab(id: string, name: string) {
      const tab = this.tabs.find((t) => t.id === id);
      if (tab) {
        tab.name = name;
        tab.updatedAt = Date.now();
      }
    },
    duplicateTab(id: string) {
      const tab = this.tabs.find((t) => t.id === id);
      if (!tab) return;

      const newTabId = crypto.randomUUID();
      const duplicatedTab: Tab = {
        ...tab,
        id: newTabId,
        name: `${tab.name} Copy`,
        panels: tab.panels.map((p) => ({
          ...p,
          id: crypto.randomUUID(),
          tabId: newTabId,
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const index = this.tabs.findIndex((t) => t.id === id);
      this.tabs.splice(index + 1, 0, duplicatedTab);
      this.activeTabId = newTabId;
    },
    addPanel(tabId: string) {
      const tab = this.tabs.find((t) => t.id === tabId);
      if (!tab || tab.type !== 'charts') return;

      // Enforce panel count limit by template
      if (tab.template === 'multi' && tab.panels.length >= 8) return;
      if (tab.template === 'compare' && tab.panels.length >= 2) return;
      if (tab.template === 'focused' && tab.panels.length >= 1) return;

      const isStocks = tab.assetMode === 'stocks';
      const defaultSym = isStocks ? 'AAPL' : 'BTCUSDT';
      const defaultEx = isStocks ? 'polygon' : 'binance';
      const defaultInt = isStocks ? '1d' : '1h';

      const newPanel: Panel = {
        id: crypto.randomUUID(),
        tabId,
        symbol: defaultSym,
        exchange: defaultEx as Exchange,
        interval: defaultInt as Interval,
        chartType: 'candlestick',
        position: tab.panels.length,
        showVolume: true,
      };
      tab.panels.push(newPanel);
      tab.updatedAt = Date.now();
    },
    removePanel(tabId: string, panelId: string) {
      const tab = this.tabs.find((t) => t.id === tabId);
      if (!tab) return;

      const panelIndex = tab.panels.findIndex((p) => p.id === panelId);
      if (panelIndex === -1) return;

      tab.panels.splice(panelIndex, 1);

      // Re-index remaining panels' position
      tab.panels.forEach((p, idx) => {
        p.position = idx;
      });
      tab.updatedAt = Date.now();
    },
    updatePanel(tabId: string, panelId: string, updates: Partial<Panel>) {
      const tab = this.tabs.find((t) => t.id === tabId);
      if (!tab) return;

      const panel = tab.panels.find((p) => p.id === panelId);
      if (panel) {
        Object.assign(panel, updates);
        tab.updatedAt = Date.now();
      }
    },
    reorderPanels(tabId: string, reorderedPanels: Panel[]) {
      const tab = this.tabs.find((t) => t.id === tabId);
      if (tab) {
        tab.panels = reorderedPanels.map((p, idx) => ({
          ...p,
          position: idx,
        }));
        tab.updatedAt = Date.now();
      }
    },
    swapPanels(tabId: string, idxA: number, idxB: number): void {
      const tab = this.tabs.find(t => t.id === tabId);
      if (!tab || idxA === idxB) return;
      if (idxA < 0 || idxB < 0 || idxA >= tab.panels.length || idxB >= tab.panels.length) return;
      // Swap in place then re-assign positions via reorderPanels
      const copy = [...tab.panels];
      [copy[idxA], copy[idxB]] = [copy[idxB], copy[idxA]];
      this.reorderPanels(tabId, copy);
    },
  },
  persist: true,
});
