import React from 'react';
import { clsx } from 'clsx';
import { generateSparklinePath } from '../../lib/utils';

const AssetSummaryCard = ({ asset, onClick }) => {
  if (!asset) return null;

  const { symbol, current_price, price_change_percentage_24h, sparkline_in_7d } = asset;
  
  // Use last 24 points for 24h sparkline (assuming hourly data)
  const sparklineData = sparkline_in_7d?.price?.slice(-24) || [];
  const isPositive = price_change_percentage_24h >= 0;
  const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
  const strokeColor = isPositive ? '#22c55e' : '#ef4444'; // green-500 : red-500
  const fillColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  const path = generateSparklinePath(sparklineData, 100, 30);

  return (
    <div 
      onClick={onClick}
      className="flex flex-col p-3 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 cursor-pointer transition-colors min-w-[160px] h-24 relative overflow-hidden group"
    >
      <div className="flex justify-between items-start z-10">
        <span className="text-xs font-bold text-gray-400">{symbol.toUpperCase()}/USD</span>
        <span className={clsx("text-xs font-medium", colorClass)}>
          {isPositive ? '+' : ''}{price_change_percentage_24h?.toFixed(2)}%
        </span>
      </div>
      
      <div className="mt-1 z-10">
        <span className="text-lg font-bold text-white">
          ${current_price?.toLocaleString()}
        </span>
      </div>

      {/* Sparkline Background */}
      <div className="absolute bottom-0 left-0 right-0 h-10 opacity-50 group-hover:opacity-80 transition-opacity">
        <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d={path} fill="none" stroke={strokeColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <path d={`${path} V 30 H 0 Z`} fill={fillColor} stroke="none" />
        </svg>
      </div>
    </div>
  );
};

export default AssetSummaryCard;