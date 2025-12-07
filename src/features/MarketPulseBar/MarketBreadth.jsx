import React from 'react';
import { useMarketBreadth } from '../../hooks/useMarketData';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MarketBreadth = () => {
  const { data, isLoading } = useMarketBreadth();
  const { t } = useTranslation();

  if (isLoading || !data) {
    return (
      <div className="flex flex-col justify-center h-full w-64 animate-pulse">
        <div className="h-4 bg-gray-800 rounded mb-2 w-1/2"></div>
        <div className="h-2 bg-gray-800 rounded w-full"></div>
      </div>
    );
  }

  const { gainers, losers, unchanged, total_tracked } = data;
  const gainersPercent = (gainers / total_tracked) * 100;
  const losersPercent = (losers / total_tracked) * 100;
  const unchangedPercent = (unchanged / total_tracked) * 100;

  return (
    <div className="flex flex-col justify-center h-full min-w-[250px] px-4 border-l border-gray-800 group relative">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('market_breadth.title')}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-800 mb-1.5">
        <div style={{ width: `${gainersPercent}%` }} className="bg-green-500 h-full transition-all duration-500"></div>
        <div style={{ width: `${losersPercent}%` }} className="bg-red-500 h-full transition-all duration-500"></div>
        <div style={{ width: `${unchangedPercent}%` }} className="bg-gray-600 h-full transition-all duration-500"></div>
      </div>

      {/* Stats */}
      <div className="flex space-x-4 text-xs font-medium">
        <div className="flex items-center text-green-500">
          <ArrowUp size={12} className="mr-1" /> {gainers}
        </div>
        <div className="flex items-center text-red-500">
          <ArrowDown size={12} className="mr-1" /> {losers}
        </div>
        <div className="flex items-center text-gray-500">
          <Minus size={12} className="mr-1" /> {unchanged}
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded shadow-xl text-xs text-gray-300 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {t('market_breadth.tooltip', { total: total_tracked, gainers, losers, unchanged })}
      </div>
    </div>
  );
};

export default MarketBreadth;