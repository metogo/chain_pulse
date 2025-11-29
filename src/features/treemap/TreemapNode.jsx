import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { clsx } from 'clsx';

const TreemapNode = ({ node, isSector, onClick, onMouseEnter, onMouseLeave }) => {
  const { selectToken, timeframe } = useAppStore();
  
  // Only render leaf nodes (tokens), not category nodes
  // Unless we are in Sector view, where we render sectors as leaves
  if (!isSector && !node.data.symbol) return null;

  const { x0, y0, x1, y1, data } = node;
  const width = x1 - x0;
  const height = y1 - y0;

  // Determine color based on price change
  const getChange = () => {
    if (isSector) return data.price_change_percentage_24h; // Weighted average
    switch (timeframe) {
      case '1h': return data.price_change_percentage_1h_in_currency;
      case '7d': return data.price_change_percentage_7d_in_currency;
      case '24h':
      default: return data.price_change_percentage_24h;
    }
  };

  const change = getChange();
  
  const getColor = (change) => {
    if (change === null || change === undefined) return '#374151'; // gray-700
    
    // Neutral color for very small changes (-0.05% to 0.05%)
    if (change > -0.05 && change < 0.05) return '#4b5563'; // gray-600

    if (change >= 0.05) {
      if (change > 15) return '#14532d'; // green-900
      if (change > 5) return '#166534'; // green-800
      if (change > 2) return '#15803d'; // green-700
      return '#16a34a'; // green-600
    } else {
      if (change < -15) return '#7f1d1d'; // red-900
      if (change < -5) return '#991b1b'; // red-800
      if (change < -2) return '#b91c1c'; // red-700
      return '#dc2626'; // red-600
    }
  };

  const backgroundColor = getColor(change);

  // Dynamic font size based on box area
  const area = width * height;
  const fontSizeClass = area > 5000 ? 'text-lg' : area > 2000 ? 'text-base' : area > 500 ? 'text-sm' : 'text-[10px]';

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSector) {
      // In sector view, use the passed onClick (drill down)
      if (onClick) onClick();
    } else {
      // In token view, open detail panel
      selectToken(data.id);
    }
  };

  const handleMouseEnter = (e) => {
    if (onMouseEnter) {
      // Pass data with calculated change for tooltip
      onMouseEnter(e, { ...data, current_change: change });
    }
  };

  const label = isSector ? data.name : data.symbol.toUpperCase();

  return (
    <div
      style={{
        position: 'absolute',
        left: x0,
        top: y0,
        width: width,
        height: height,
        backgroundColor: backgroundColor,
      }}
      className={clsx(
        "border border-gray-900 hover:brightness-110 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center overflow-hidden p-0.5 text-white",
        "group"
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      title={`${data.name} (${isSector ? 'Sector' : data.symbol.toUpperCase()})\nPrice: ${isSector ? 'N/A' : '$' + data.current_price}\nChange: ${change?.toFixed(2)}%`}
    >
      {/* Always try to show Symbol/Name if width allows at least 2-3 chars */}
      {width > 20 && height > 14 && (
        <span className={clsx("font-bold truncate w-full text-center leading-tight", fontSizeClass)}>
          {label}
        </span>
      )}
      
      {/* Show change % only if enough space */}
      {width > 40 && height > 30 && (
        <span className="text-[9px] sm:text-[10px] opacity-90 leading-tight">
          {change > 0 ? '+' : ''}{change?.toFixed(1)}%
        </span>
      )}
    </div>
  );
};

export default TreemapNode;