import React from 'react';
import { useFearAndGreedIndex, useLongShortRatio, useGlobalDeFiTVL } from '../../hooks/useMarketData';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

const MacroWidget = ({ title, children, tooltip }) => (
  <div className="flex flex-col justify-center h-full px-4 border-l border-gray-800 group relative min-w-[170x]">
    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{title}</div>
    {children}
    {tooltip && (
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 p-2 bg-gray-900 border border-gray-700 rounded shadow-xl text-xs text-gray-300 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {tooltip}
      </div>
    )}
  </div>
);

const FearGreedWidget = () => {
  const { data, isLoading } = useFearAndGreedIndex();
  const { t } = useTranslation();

  if (isLoading || !data) return <div className="animate-pulse h-10 bg-gray-800 rounded w-full"></div>;

  const value = parseInt(data.value);
  const classification = data.value_classification;
  
  let color = 'text-gray-400';
  if (value <= 25) color = 'text-red-500';
  else if (value <= 45) color = 'text-orange-500';
  else if (value <= 55) color = 'text-gray-400';
  else if (value <= 75) color = 'text-green-400';
  else color = 'text-green-500';

  return (
    <MacroWidget title={t('macro.fear_greed')} tooltip={t('macro.fear_greed_tooltip')}>
      <div className="flex items-end space-x-2">
        <span className={`text-2xl font-bold leading-none ${color}`}>{value}</span>
        <span className={`text-xs font-medium mb-0.5 ${color}`}>{classification}</span>
      </div>
      {/* Simple Gauge Bar */}
      <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1.5 overflow-hidden">
        <div 
          className="h-full transition-all duration-500"
          style={{ 
            width: `${value}%`,
            backgroundColor: value > 50 ? '#22c55e' : '#ef4444'
          }}
        ></div>
      </div>
    </MacroWidget>
  );
};

const LongShortWidget = () => {
  const { data, isLoading } = useLongShortRatio();
  const { t } = useTranslation();

  if (isLoading || !data) return <div className="animate-pulse h-10 bg-gray-800 rounded w-full"></div>;

  const { longShortRatio, longAccount, shortAccount } = data;

  return (
    <MacroWidget title={t('macro.long_short')} tooltip={t('macro.long_short_tooltip')}>
      <div className="flex justify-between items-end mb-1">
        <span className="text-lg font-bold text-white leading-none">{longShortRatio.toFixed(2)}</span>
        <div className="text-[10px] space-x-1">
          <span className="text-green-500">L: {longAccount.toFixed(0)}%</span>
          <span className="text-red-500">S: {shortAccount.toFixed(0)}%</span>
        </div>
      </div>
      <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-gray-800">
        <div style={{ width: `${longAccount}%` }} className="bg-green-500 h-full"></div>
        <div style={{ width: `${shortAccount}%` }} className="bg-red-500 h-full"></div>
      </div>
    </MacroWidget>
  );
};

const DeFiTVLWidget = () => {
  const { data, isLoading } = useGlobalDeFiTVL();
  const { t } = useTranslation();

  if (isLoading || !data) return <div className="animate-pulse h-10 bg-gray-800 rounded w-full"></div>;

  const { tvl, change_24h } = data;
  const isPositive = change_24h >= 0;

  const formatTVL = (val) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <MacroWidget title={t('macro.defi_tvl')} tooltip={t('macro.defi_tvl_tooltip')}>
      <div className="flex items-end space-x-2">
        <span className="text-xl font-bold text-white leading-none">{formatTVL(tvl)}</span>
        <span className={`text-xs font-medium mb-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{change_24h.toFixed(2)}%
        </span>
      </div>
    </MacroWidget>
  );
};

const MacroIndicatorsBar = () => {
  return (
    <div className="flex h-full">
      <FearGreedWidget />
      <LongShortWidget />
      <DeFiTVLWidget />
    </div>
  );
};

export default MacroIndicatorsBar;