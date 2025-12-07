import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useTreemapData } from './useTreemapData';
import TreemapNode from './TreemapNode';
import HoverCard from './HoverCard';
import { useMarketData } from '../../hooks/useMarketData';
import { getCoinCategory, getCoinEcosystems } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const TreemapContainer = () => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const {
    ecosystemFilter,
    viewMode,
    selectedSector,
    enterSector,
    selectToken,
    pinnedTokenId,
    setPinnedTokenId
  } = useAppStore();
  const [tooltip, setTooltip] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const { t } = useTranslation();
  
  const { data: marketData, isLoading, error } = useMarketData('USD', 100, null, ecosystemFilter);

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
    if (!data || pinnedTokenId) return; // Don't show new tooltip if one is pinned
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate position to keep tooltip within bounds
      let x = e.clientX - rect.left + 15;
      let y = e.clientY - rect.top + 15;

      // Adjust if too close to right edge
      if (x + 320 > dimensions.width) {
        x = e.clientX - rect.left - 335; // Width of card + padding
      }

      // Adjust if too close to bottom edge
      if (y + 300 > dimensions.height) {
        y = e.clientY - rect.top - 315; // Height of card + padding
      }

      setTooltip({
        x: Math.max(10, x), // Ensure not off-screen left
        y: Math.max(10, y), // Ensure not off-screen top
        data: data
      });
    }, 200);
  };

  const handleNodeMouseLeave = (e) => {
    // Check if moving to the tooltip
    if (e && e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.hover-card-container')) {
      return;
    }

    if (pinnedTokenId) return; // Don't hide if pinned

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setTooltip(null);
  };

  const handleNodeMouseMove = (e) => {
    if (tooltip && !pinnedTokenId) {
      // Don't update position if hovering over the card itself
      if (e.target.closest && e.target.closest('.hover-card-container')) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left + 15;
      let y = e.clientY - rect.top + 15;

      if (x + 320 > dimensions.width) {
        x = e.clientX - rect.left - 335;
      }
      if (y + 300 > dimensions.height) {
        y = e.clientY - rect.top - 315;
      }

      setTooltip(prev => ({
        ...prev,
        x: Math.max(10, x),
        y: Math.max(10, y)
      }));
    }
  };

  const handlePin = () => {
    if (tooltip && tooltip.data) {
      if (pinnedTokenId === tooltip.data.id) {
        setPinnedTokenId(null); // Unpin
      } else {
        setPinnedTokenId(tooltip.data.id); // Pin
      }
    }
  };

  // Close pinned tooltip when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pinnedTokenId && !e.target.closest('.hover-card-container')) {
        setPinnedTokenId(null);
        setTooltip(null);
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape' && pinnedTokenId) {
        setPinnedTokenId(null);
        setTooltip(null);
      }
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [pinnedTokenId, setPinnedTokenId]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800 border-t-0 rounded-t-none">
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

        {root && root.leaves().map((leafNode, index) => {
          if (!leafNode.data) return null;
          
          // Create a unique key using id/name and index to ensure uniqueness
          const uniqueKey = `${leafNode.data.id || leafNode.data.name || 'node'}-${index}`;

          return (
            <TreemapNode
              key={uniqueKey}
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

        {/* Hover Card / Tooltip */}
        {tooltip && tooltip.data && (
          <div className="hover-card-container">
            <HoverCard
              tokenId={tooltip.data.id}
              data={tooltip.data}
              position={{ x: tooltip.x, y: tooltip.y }}
              isPinned={pinnedTokenId === tooltip.data.id}
              onPin={handlePin}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TreemapContainer;