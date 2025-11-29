import { useMemo } from 'react';
import * as d3 from 'd3';
import { useAppStore } from '../../store/useAppStore';

export const useTreemapData = (data, width, height) => {
  const { sizingMetric, viewMode, selectedSector } = useAppStore();

  const root = useMemo(() => {
    if (!data || data.length === 0 || width === 0 || height === 0) {
      return null;
    }

    console.log('[DEBUG_TREEMAP] useTreemapData: Starting layout calculation', { dataLength: data.length, width, height, sizingMetric, viewMode, selectedSector });

    let hierarchyData;

    if (viewMode === 'sector') {
      // L1: Group by Sector, aggregate values
      const groupedData = d3.group(data, d => d.category);
      
      hierarchyData = {
        name: "Market",
        children: Array.from(groupedData, ([key, value]) => {
          // Aggregate values for the sector
          const totalMarketCap = d3.sum(value, d => d.market_cap);
          const totalVolume = d3.sum(value, d => d.total_volume);
          // Weighted average for price change
          const weightedChange = d3.sum(value, d => d.price_change_percentage_24h * d.market_cap) / totalMarketCap;

          return {
            name: key,
            value: sizingMetric === 'market_cap' ? totalMarketCap : totalVolume,
            market_cap: totalMarketCap,
            total_volume: totalVolume,
            price_change_percentage_24h: weightedChange,
            isSector: true, // Flag to identify sector nodes
            symbol: key, // Use sector name as symbol for display
            id: key
          };
        })
      };
    } else {
      // L2: Token View (Drill-down)
      // Filter data for the selected sector
      const sectorData = selectedSector ? data.filter(d => d.category === selectedSector) : data;
      
      console.log('[DEBUG_TREEMAP] Sector Data:', sectorData.length, sectorData);

      hierarchyData = {
        name: selectedSector || "Market",
        children: sectorData // These are the tokens
      };
    }

    // 3. Create d3 hierarchy
    const rootHierarchy = d3.hierarchy(hierarchyData)
      .sum(d => {
        if (viewMode === 'sector') {
          // For sector view, the children already have 'value' computed
          return d.value;
        }
        
        // For token view
        let value = 0;
        if (sizingMetric === 'market_cap') value = d.market_cap;
        else if (sizingMetric === 'volume_24h') value = d.total_volume;
        else value = d.market_cap;

        return Math.max(0, Number(value) || 0);
      })
      .sort((a, b) => b.value - a.value);

    // Debug log
    console.log('[DEBUG_TREEMAP] Hierarchy Total Value:', rootHierarchy.value);

    // 4. Compute treemap layout
    d3.treemap()
      .size([width, height])
      .paddingTop(viewMode === 'token' ? 28 : 0) // Padding for sector label only in token view
      .paddingRight(4)
      .paddingBottom(4)
      .paddingLeft(4)
      .paddingInner(2)
      .round(true)
      (rootHierarchy);

    return rootHierarchy;
  }, [data, width, height, sizingMetric, viewMode, selectedSector]);

  return root;
};