import React from 'react';
import { useGlobalData } from '../../hooks/useMarketData';
import { useAppStore } from '../../store/useAppStore';
import { TrendingUp, TrendingDown, Activity, Zap, Globe, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GlobalMarketBar = () => {
  const { data: globalData, isLoading, error } = useGlobalData();
  const { isStreamConnected } = useAppStore();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  if (isLoading) return <div className="w-full h-10 bg-gray-900 border-b border-gray-800 animate-pulse"></div>;
  if (error) return <div className="w-full h-10 bg-gray-900 border-b border-gray-800 flex items-center px-4 text-red-500 text-xs">{t('app.error')}</div>;

  const { data } = globalData;

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    return `$${value.toLocaleString()}`;
  };

  const MarketItem = ({ label, value, change, icon: Icon }) => (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-400">{label}:</span>
      <span className="font-medium text-white">{value}</span>
      {change !== undefined && (
        <span className={`flex items-center ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          {Math.abs(change).toFixed(1)}%
        </span>
      )}
      {Icon && <Icon size={14} className="text-blue-400 ml-1" />}
    </div>
  );

  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div className="flex items-center space-x-6">
        <MarketItem 
          label={t('detail_panel.market_cap')} 
          value={formatCurrency(data.total_market_cap.usd)} 
          // change={data.market_cap_change_percentage_24h_usd} // Not available in derived data
        />
        <MarketItem 
          label={t('detail_panel.volume_24h')} 
          value={formatCurrency(data.total_volume.usd)} 
          icon={Activity}
        />
        <MarketItem 
          label="BTC Dom" 
          value={`${data.market_cap_percentage.btc.toFixed(1)}%`} 
        />
        <MarketItem 
          label="ETH Dom" 
          value={`${data.market_cap_percentage.eth.toFixed(1)}%`} 
        />
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-400">Gas:</span>
          <span className="font-medium text-white flex items-center">
            <Zap size={14} className="text-yellow-500 mr-1" />
            {data.gas_price ? `${data.gas_price} Gwei` : '...'}
          </span>
        </div>
      </div>
      
      {/* Market Sentiment Bar (Mock for now as API doesn't provide direct sentiment) */}
      <div className="hidden md:flex items-center space-x-2 ml-6">
        <span className="text-xs text-gray-400">{t('global_bar.sentiment')}:</span>
        <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-green-500" style={{ width: '65%' }}></div>
          <div className="h-full bg-red-500" style={{ width: '35%' }}></div>
        </div>
      </div>

      {/* Language Switcher */}
      <button
        onClick={toggleLanguage}
        className="flex items-center text-xs text-gray-400 hover:text-white transition-colors ml-6"
        title="Switch Language"
      >
        <Globe size={14} className="mr-1" />
        {i18n.language === 'en' ? 'EN' : '中文'}
      </button>

      {/* Connection Status */}
      <div className="ml-4 flex items-center" title={isStreamConnected ? "Connected to Pulse Engine" : "Disconnected"}>
        {isStreamConnected ? (
          <Wifi size={14} className="text-green-500" />
        ) : (
          <WifiOff size={14} className="text-red-500 animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default GlobalMarketBar;