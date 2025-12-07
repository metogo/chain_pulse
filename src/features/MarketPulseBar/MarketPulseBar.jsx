import React from 'react';
import { useMarketData } from '../../hooks/useMarketData';
import { useAppStore } from '../../store/useAppStore';
import AssetSummaryCard from './AssetSummaryCard';
import MarketBreadth from './MarketBreadth';
import MacroIndicatorsBar from './MacroIndicatorsBar';

const CORE_ASSETS = ['btc', 'eth', 'sol', 'bnb'];

const MarketPulseBar = () => {
  const { data: marketData } = useMarketData();
  const { selectToken } = useAppStore();

  const coreAssetsData = marketData?.filter(coin => 
    CORE_ASSETS.includes(coin.symbol.toLowerCase())
  ).sort((a, b) => {
    // Sort by defined order
    return CORE_ASSETS.indexOf(a.symbol.toLowerCase()) - CORE_ASSETS.indexOf(b.symbol.toLowerCase());
  });

  if (!coreAssetsData || coreAssetsData.length === 0) return null;

  return (
    <div className="w-full bg-gray-950 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
      {/* Core Assets */}
      <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-1 flex-none">
        {coreAssetsData.map(asset => (
          <AssetSummaryCard
            key={asset.id}
            asset={asset}
            onClick={() => selectToken(asset.id)}
          />
        ))}
      </div>

      {/* Macro Indicators (Spacer Area) */}
      <div className="hidden xl:flex flex-1 justify-center px-4 h-24">
        <MacroIndicatorsBar />
      </div>

      {/* Market Breadth */}
      <div className="hidden lg:block flex-none ml-4 h-24">
        <MarketBreadth />
      </div>
    </div>
  );
};

export default MarketPulseBar;