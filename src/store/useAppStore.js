import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // Control Panel State
  timeframe: '24h', // '1h', '24h', '7d', '30d'
  sizingMetric: 'market_cap', // 'market_cap', 'volume_24h', 'tvl'
  ecosystemFilter: 'all', // 'all', 'ethereum', 'solana', etc.
  
  // Main View State (Treemap vs List)
  mainViewMode: localStorage.getItem('mainViewMode') || 'treemap', // 'treemap' or 'list'

  // Drill-Down State (Treemap Internal)
  viewMode: 'token', // 'sector' (L1) or 'token' (L2) - Default to 'token' (Coins)
  selectedSector: null, // e.g., 'Layer 1', 'DeFi'

  // Detail Panel State
  selectedTokenId: null,
  isDetailPanelOpen: false,

  // Hover Card State
  pinnedTokenId: null,

  // Actions
  setTimeframe: (newTimeframe) => set({ timeframe: newTimeframe }),
  setSizingMetric: (newMetric) => set({ sizingMetric: newMetric }),
  setEcosystemFilter: (newFilter) => set({ ecosystemFilter: newFilter }),
  setMainViewMode: (mode) => {
    localStorage.setItem('mainViewMode', mode);
    set({ mainViewMode: mode });
  },
  
  // Drill-Down Actions
  enterSector: (sectorName) => set({ viewMode: 'token', selectedSector: sectorName }),
  enterEcosystemView: () => set({ viewMode: 'token', selectedSector: null }), // New action for direct drill-down
  goBackToSectors: () => set({ viewMode: 'sector', selectedSector: null }),

  selectToken: (tokenId) => set({ selectedTokenId: tokenId, isDetailPanelOpen: true }),
  closeDetailPanel: () => set({ isDetailPanelOpen: false, selectedTokenId: null }),

  // Hover Card Actions
  setPinnedTokenId: (tokenId) => set({ pinnedTokenId: tokenId }),
}));