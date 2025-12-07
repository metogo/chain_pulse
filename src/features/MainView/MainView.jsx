import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home, Grid, Layers, LayoutGrid, List } from 'lucide-react';
import { clsx } from 'clsx';
import TreemapContainer from '../treemap/TreemapContainer';
import DataListView from '../DataList/DataListView';

const MainView = () => {
  const { 
    viewMode, 
    mainViewMode, 
    setMainViewMode,
    selectedSector, 
    enterEcosystemView, 
    goBackToSectors 
  } = useAppStore();
  const { t } = useTranslation();

  // Group By Switcher Component
  const GroupBySwitcher = () => (
    <div className="flex bg-gray-800 rounded-lg p-0.5 ml-4">
      <button
        onClick={() => enterEcosystemView()} // Switch to 'token' view (Coins)
        className={clsx(
          "flex items-center px-3 py-1 text-xs font-medium rounded-md transition-all",
          viewMode === 'token' && !selectedSector
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-400 hover:text-gray-200"
        )}
      >
        <Grid size={12} className="mr-1.5" />
        {t('treemap.coins')}
      </button>
      <button
        onClick={() => goBackToSectors()} // Switch to 'sector' view
        className={clsx(
          "flex items-center px-3 py-1 text-xs font-medium rounded-md transition-all",
          viewMode === 'sector'
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-400 hover:text-gray-200"
        )}
      >
        <Layers size={12} className="mr-1.5" />
        {t('treemap.sectors')}
      </button>
    </div>
  );

  // View Mode Switcher (Treemap vs List)
  const ViewModeSwitcher = () => (
    <div className="flex bg-gray-800 rounded-lg p-0.5 ml-4">
      <button
        onClick={() => setMainViewMode('treemap')}
        className={clsx(
          "flex items-center px-3 py-1 text-xs font-medium rounded-md transition-all",
          mainViewMode === 'treemap'
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-400 hover:text-gray-200"
        )}
      >
        <LayoutGrid size={12} className="mr-1.5" />
        {t('view_mode.treemap') || 'Treemap'}
      </button>
      <button
        onClick={() => setMainViewMode('list')}
        className={clsx(
          "flex items-center px-3 py-1 text-xs font-medium rounded-md transition-all",
          mainViewMode === 'list'
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-400 hover:text-gray-200"
        )}
      >
        <List size={12} className="mr-1.5" />
        {t('view_mode.list') || 'List'}
      </button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-sm h-12 flex-none">
        <div className="flex items-center">
          {/* If we are drilled down into a sector, show breadcrumbs */}
          {viewMode === 'token' && selectedSector ? (
            <>
              <button 
                onClick={goBackToSectors}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <Home size={14} className="mr-1" />
                {t('treemap.all_sectors')}
              </button>
              <ChevronRight size={14} className="mx-2 text-gray-600" />
              <span className="text-white font-bold">{selectedSector}</span>
            </>
          ) : (
            /* If at root level (Coins or Sectors), show Switcher */
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">{t('treemap.group_by')}</span>
              <GroupBySwitcher />
              
              {/* View Mode Switcher */}
              <div className="w-px h-4 bg-gray-700 mx-4"></div>
              <ViewModeSwitcher />
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {mainViewMode === 'treemap' ? (
          <TreemapContainer />
        ) : (
          <DataListView />
        )}
      </div>
    </div>
  );
};

export default MainView;