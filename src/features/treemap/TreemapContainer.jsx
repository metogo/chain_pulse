import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useTreemapData } from './useTreemapData';
import TreemapNode from './TreemapNode';
import { useMarketData } from '../../hooks/useMarketData';
import { getCoinCategory, getCoinEcosystems } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { ChevronRight, Home, Grid, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const TreemapContainer = () => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { ecosystemFilter, viewMode, selectedSector, enterSector, goBackToSectors, enterEcosystemView, selectToken } = useAppStore();
  const [tooltip, setTooltip] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const { t } = useTranslation();
  
  const { data: marketData, isLoading, error } = useMarketData();

  useEffect(() => {
    if (!containerRef.current) {
      console.warn('[DEBUG_TREEMAP] containerRef is null on mount!');
      return;
    }

    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        if (offsetWidth > 0 && offsetHeight > 0) {
          setDimensions({ width: offsetWidth, height: offsetHeight });
        }
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          requestAnimationFrame(() => {
             setDimensions({ width, height });
          });
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    const intervalId = setInterval(() => {
      if (dimensions.width === 0) {
        updateDimensions();
      } else {
        clearInterval(intervalId);
      }
    }, 500);
    
    const timeoutId = setTimeout(() => clearInterval(intervalId), 5000);

    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Process data: Add category and filter
  const processedData = useMemo(() => {
    if (!marketData) return [];
    
    let data = marketData.map(coin => ({
      ...coin,
      category: getCoinCategory(coin.symbol)
    }));

    if (ecosystemFilter !== 'all') {
      const filter = ecosystemFilter.toLowerCase();
      data = data.filter(coin => {
        const ecosystems = getCoinEcosystems(coin.symbol);
        return ecosystems.includes(filter);
      });
    }

    return data;
  }, [marketData, ecosystemFilter]);

  const root = useTreemapData(processedData, dimensions.width, dimensions.height);

  const handleNodeMouseEnter = (e, data) => {
    if (!data) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        data: data
      });
    }, 200);
  };

  const handleNodeMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setTooltip(null);
  };

  const handleNodeMouseMove = (e) => {
    if (tooltip) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltip(prev => ({
        ...prev,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }));
    }
  };

  // Group By Switcher Component
  const GroupBySwitcher = () => (
    <div className="flex bg-gray-800 rounded-lg p-0.5 ml-4">
      <button
        onClick={() => enterEcosystemView()} // Switch to 'token' view (Coins)
        className={clsx(
          "flex items-center px-3 py-1 text-xs font-medium rounded-md transition-all",
          viewMode === 'token' && !selectedSector // Active if token view and no specific sector selected (root token view)
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

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-sm h-12">
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
            </div>
          )}
        </div>
      </div>

      {/* Treemap Area */}
      <div 
        className="flex-1 relative overflow-hidden" 
        ref={containerRef}
        onMouseMove={handleNodeMouseMove}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-950/80">
            <div className="text-blue-500 animate-pulse">{t('app.loading')}</div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-950">
            <div className="text-red-500">{t('app.error')}</div>
          </div>
        )}

        {!isLoading && !error && (!processedData || processedData.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-950">
            <div className="text-gray-500">{t('app.no_data')}</div>
          </div>
        )}

        {root && root.leaves().map((leafNode) => {
          if (!leafNode.data) return null;
          
          return (
            <TreemapNode 
              key={leafNode.data.id || leafNode.data.name || Math.random()} 
              node={leafNode} 
              isSector={viewMode === 'sector'}
              onClick={() => {
                if (viewMode === 'sector') {
                  enterSector(leafNode.data.name);
                } else {
                  selectToken(leafNode.data.id);
                }
              }}
              onMouseEnter={(e, data) => handleNodeMouseEnter(e, data)}
              onMouseLeave={handleNodeMouseLeave}
            />
          );
        })}
        
        {!isLoading && !error && (!root || !root.children || root.children.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
            {dimensions.width === 0 ? t('app.initializing') : t('app.no_data_display')}
          </div>
        )}

        {/* Tooltip */}
        {tooltip && tooltip.data && (
          <div 
            className="absolute z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 pointer-events-none text-sm w-56"
            style={{ 
              left: Math.min(tooltip.x + 15, dimensions.width - 240), 
              top: Math.min(tooltip.y + 15, dimensions.height - 150)
            }}
          >
            <div className="font-bold text-white mb-1 flex justify-between items-center">
              <span>{tooltip.data.name}</span>
              <span className="text-gray-400 text-xs">{tooltip.data.symbol?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Price:</span>
              <span className="text-white font-mono">
                {tooltip.data.current_price ? `$${tooltip.data.current_price.toLocaleString()}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>24h Change:</span>
              <span className={tooltip.data.current_change >= 0 ? "text-green-500" : "text-red-500"}>
                {tooltip.data.current_change > 0 ? '+' : ''}{tooltip.data.current_change?.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-gray-300 mt-1 pt-1 border-t border-gray-800">
              <span>M. Cap:</span>
              <span className="text-white">
                {tooltip.data.market_cap ? `$${(tooltip.data.market_cap / 1e9).toFixed(2)}B` : 'N/A'}
              </span>
            </div>
            {/* Sparkline Placeholder */}
            <div className="mt-2 h-8 w-full flex items-end space-x-0.5 opacity-50">
               {Array.from({ length: 20 }).map((_, i) => (
                 <div 
                   key={i} 
                   className={`flex-1 ${tooltip.data.current_change >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                   style={{ height: `${Math.random() * 100}%` }}
                 ></div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreemapContainer;