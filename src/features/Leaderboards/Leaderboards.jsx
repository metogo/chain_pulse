import React, { useState } from 'react';
import { useMarketData } from '../../hooks/useMarketData';
import { useAppStore } from '../../store/useAppStore';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const Leaderboards = () => {
  const [activeTab, setActiveTab] = useState('gainers');
  const { selectToken, timeframe } = useAppStore();
  const { data: marketData, isLoading } = useMarketData();
  const { t } = useTranslation();

  const getSortedData = () => {
    if (!marketData) return [];
    const data = [...marketData];
    
    // Helper to get change based on global timeframe
    const getChange = (item) => {
      switch (timeframe) {
        case '1h': return item.price_change_percentage_1h_in_currency;
        case '7d': return item.price_change_percentage_7d_in_currency;
        case '24h':
        default: return item.price_change_percentage_24h;
      }
    };

    switch (activeTab) {
      case 'gainers':
        return data.sort((a, b) => getChange(b) - getChange(a));
      case 'losers':
        return data.sort((a, b) => getChange(a) - getChange(b));
      case 'volume':
        return data.sort((a, b) => b.total_volume - a.total_volume);
      default:
        return data;
    }
  };

  const items = getSortedData();

  const getChangeValue = (item) => {
    switch (timeframe) {
      case '1h': return item.price_change_percentage_1h_in_currency;
      case '7d': return item.price_change_percentage_7d_in_currency;
      case '24h':
      default: return item.price_change_percentage_24h;
    }
  };

  const formatVolume = (num) => {
    if (!num) return '0';
    if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(2) + "B";
    if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(2) + "M";
    if (num >= 1.0e+3) return (num / 1.0e+3).toFixed(2) + "K";
    return num.toLocaleString();
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={clsx(
        "flex-1 flex items-center justify-center py-2 text-xs font-medium border-b-2 transition-colors",
        activeTab === id
          ? "border-blue-500 text-white"
          : "border-transparent text-gray-500 hover:text-gray-300"
      )}
    >
      {Icon && <Icon size={12} className="mr-1.5" />}
      {label}
    </button>
  );

  return (
    <div className="w-64 bg-gray-950 border-l border-gray-800 flex flex-col h-full">
      <div className="flex border-b border-gray-800">
        <TabButton id="gainers" label={t('leaderboard.gainers')} icon={TrendingUp} />
        <TabButton id="losers" label={t('leaderboard.losers')} icon={TrendingDown} />
        <TabButton id="volume" label={t('leaderboard.volume')} icon={Activity} />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-20 text-gray-500 text-xs">{t('app.loading')}</div>
        ) : (
          items.map((item, index) => {
            const change = getChangeValue(item);
            const isVolumeTab = activeTab === 'volume';

            return (
              <div
                key={item.id}
                onClick={() => selectToken(item.id)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-900 cursor-pointer group transition-colors"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="text-xs text-gray-500 w-4 flex-shrink-0">{index + 1}</span>
                  <img src={item.image} alt={item.name} className="w-6 h-6 rounded-full flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {item.symbol.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500 truncate">
                      {item.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end flex-shrink-0 ml-2">
                  <span className="text-xs text-gray-300">
                    ${item.current_price < 1 ? item.current_price.toFixed(4) : item.current_price.toLocaleString()}
                  </span>
                  {isVolumeTab ? (
                    <span className="text-[10px] font-medium text-gray-400">
                      ${formatVolume(item.total_volume)}
                    </span>
                  ) : (
                    <span className={clsx(
                      "text-[10px] font-medium",
                      change >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {change >= 0 ? '+' : ''}
                      {change?.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboards;