import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Clock, BarChart2, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const ControlPanel = () => {
  const { 
    timeframe, setTimeframe,
    sizingMetric, setSizingMetric,
    ecosystemFilter, setEcosystemFilter,
    enterEcosystemView, goBackToSectors
  } = useAppStore();
  const { t } = useTranslation();

  const handleEcosystemChange = (chain) => {
    const filter = chain.toLowerCase();
    setEcosystemFilter(filter);
    
    if (filter !== 'all') {
      enterEcosystemView();
    } else {
      goBackToSectors();
    }
  };

  const ControlGroup = ({ title, icon: Icon, children }) => (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center text-gray-400 text-xs font-medium uppercase tracking-wider">
        <Icon size={12} className="mr-1.5" />
        {title}
      </div>
      <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
        {children}
      </div>
    </div>
  );

  const ControlButton = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
        active 
          ? "bg-gray-700 text-white shadow-sm" 
          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col space-y-6 p-4 bg-gray-950 border-r border-gray-800 h-full w-64">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <BarChart2 className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">{t('app.title')}</h1>
      </div>

      <ControlGroup title={t('control_panel.timeframe')} icon={Clock}>
        <ControlButton active={timeframe === '1h'} onClick={() => setTimeframe('1h')}>1H</ControlButton>
        <ControlButton active={timeframe === '24h'} onClick={() => setTimeframe('24h')}>24H</ControlButton>
        <ControlButton active={timeframe === '7d'} onClick={() => setTimeframe('7d')}>7D</ControlButton>
      </ControlGroup>

      <ControlGroup title={t('control_panel.size_by')} icon={BarChart2}>
        <ControlButton active={sizingMetric === 'market_cap'} onClick={() => setSizingMetric('market_cap')}>M.Cap</ControlButton>
        <ControlButton active={sizingMetric === 'volume_24h'} onClick={() => setSizingMetric('volume_24h')}>Vol</ControlButton>
      </ControlGroup>

      <ControlGroup title={t('control_panel.ecosystem')} icon={Layers}>
        <div className="flex flex-col space-y-1 w-full">
          {['All', 'Ethereum', 'Solana', 'BNB Chain'].map((chain) => (
            <button
              key={chain}
              onClick={() => handleEcosystemChange(chain)}
              className={clsx(
                "w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-all duration-200",
                ecosystemFilter === chain.toLowerCase()
                  ? "bg-gray-800 text-white border border-gray-700"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
              )}
            >
              {chain}
            </button>
          ))}
        </div>
      </ControlGroup>
      
      <div className="mt-auto pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <p>{t('control_panel.updated')}</p>
          <p className="mt-1">{t('control_panel.source')}</p>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;