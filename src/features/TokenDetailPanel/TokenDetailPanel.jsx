import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useCoinDetails, useCoinMarketChart } from '../../hooks/useMarketData';
import { getCoinCategory } from '../../lib/utils';
import { X, ExternalLink, Copy, Globe, Twitter, MessageCircle, FileText, Activity, Layers, BarChart2, Users, Wallet, TrendingUp, ArrowRightLeft, Fish } from 'lucide-react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import { clsx } from 'clsx';

const TokenDetailPanel = () => {
  const { selectedTokenId, isDetailPanelOpen, closeDetailPanel } = useAppStore();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [chartDays, setChartDays] = useState(1);
  const [activeTab, setActiveTab] = useState('market'); // 'market', 'onchain', 'about'

  const { data: tokenDetails, isLoading: isDetailsLoading } = useCoinDetails(selectedTokenId);
  const { data: marketChart, isLoading: isChartLoading } = useCoinMarketChart(selectedTokenId, chartDays);

  useEffect(() => {
    if (!isDetailPanelOpen || !marketChart || !chartContainerRef.current || activeTab !== 'market') return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: '#374151' },
          horzLines: { color: '#374151' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 200,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      if (!chart) return;

      const lineSeries = chart.addSeries(LineSeries, {
        color: tokenDetails?.market_data?.price_change_percentage_24h >= 0 ? '#22c55e' : '#ef4444',
        lineWidth: 2,
      });

      if (marketChart.prices && marketChart.prices.length > 0) {
        const data = marketChart.prices.map(([timestamp, price]) => ({
          time: timestamp / 1000,
          value: price,
        }));
        
        data.sort((a, b) => a.time - b.time);
        const validData = data.filter(d => d.time && !isNaN(d.value));

        if (validData.length > 0) {
          lineSeries.setData(validData);
          requestAnimationFrame(() => {
              chart.timeScale().fitContent();
          });
        }
      }

      chartRef.current = chart;

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }, [isDetailPanelOpen, marketChart, tokenDetails, activeTab]);

  if (!isDetailPanelOpen) return null;

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatSupply = (num) => {
    if (!num) return 'N/A';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const category = getCoinCategory(tokenDetails?.symbol);
  const isL1 = category === 'Layer 1' || category === 'Layer 2';
  const isDeFi = category === 'DeFi';

  const TimeframeButton = ({ days, label }) => (
    <button
      onClick={() => setChartDays(days)}
      className={clsx(
        "px-2 py-1 text-xs font-medium rounded transition-colors",
        chartDays === days
          ? "bg-gray-700 text-white"
          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
      )}
    >
      {label}
    </button>
  );

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={clsx(
        "flex-1 flex items-center justify-center py-3 text-sm font-medium border-b-2 transition-colors",
        activeTab === id
          ? "border-blue-500 text-white"
          : "border-transparent text-gray-400 hover:text-gray-200"
      )}
    >
      {Icon && <Icon size={16} className="mr-2" />}
      {label}
    </button>
  );

  const StatCard = ({ title, value, change, icon: Icon, color = "blue" }) => (
    <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-800">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-xs text-gray-500 mb-1">{title}</div>
          <div className="text-lg font-bold text-white">{value}</div>
          {change && <div className={`text-xs ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</div>}
        </div>
        {Icon && <Icon size={16} className={`text-${color}-400`} />}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-4">
          {isDetailsLoading ? (
            <div className="animate-pulse flex space-x-3">
              <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-800 rounded"></div>
                <div className="h-3 w-12 bg-gray-800 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <img src={tokenDetails?.image?.large} alt={tokenDetails?.name} className="w-10 h-10 rounded-full" />
              <div>
                <h2 className="text-xl font-bold text-white">{tokenDetails?.name}</h2>
                <span className="text-sm text-gray-400 uppercase">{tokenDetails?.symbol}</span>
              </div>
            </div>
          )}
          <button onClick={closeDetailPanel} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Price Info (Always Visible) */}
        {!isDetailsLoading && (
          <div className="mb-6">
            <div className="text-3xl font-bold text-white">
              ${tokenDetails?.market_data?.current_price?.usd?.toLocaleString()}
            </div>
            <div className={`flex items-center text-sm font-medium mt-1 ${tokenDetails?.market_data?.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {tokenDetails?.market_data?.price_change_percentage_24h >= 0 ? '+' : ''}
              {tokenDetails?.market_data?.price_change_percentage_24h?.toFixed(2)}% (24h)
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-6">
        <TabButton id="market" label="Market" icon={BarChart2} />
        <TabButton id="onchain" label="On-Chain" icon={Activity} />
        <TabButton id="about" label="About" icon={FileText} />
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 overflow-y-auto">
        
        {/* MARKET TAB */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            {/* Chart */}
            <div className="relative">
              <div className="flex justify-end space-x-1 mb-2">
                <TimeframeButton days={1} label="1D" />
                <TimeframeButton days={7} label="7D" />
                <TimeframeButton days={30} label="30D" />
              </div>
              <div className="h-[200px] w-full bg-gray-950 rounded-lg border border-gray-800 overflow-hidden relative" ref={chartContainerRef}>
                {isChartLoading && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs bg-gray-950/80 z-10">
                    Loading Chart...
                  </div>
                )}
                {!isChartLoading && (!marketChart?.prices || marketChart.prices.length === 0) && (
                   <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                     No chart data available
                   </div>
                )}
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Market Cap</div>
                <div className="text-sm font-medium text-white">{formatNumber(tokenDetails?.market_data?.market_cap?.usd)}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Volume (24h)</div>
                <div className="text-sm font-medium text-white">{formatNumber(tokenDetails?.market_data?.total_volume?.usd)}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">FDV</div>
                <div className="text-sm font-medium text-white">{formatNumber(tokenDetails?.market_data?.fdv)}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Circulating Supply</div>
                <div className="text-sm font-medium text-white">{formatSupply(tokenDetails?.market_data?.circulating_supply)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ON-CHAIN TAB */}
        {activeTab === 'onchain' && (
          <div className="space-y-6">
            {/* Network Health (L1/L2) */}
            {(isL1 || !isDeFi) && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Network Health</h3>
                <div className="grid grid-cols-1 gap-4">
                  <StatCard title="Daily Active Addresses" value="N/A" change="" icon={Users} color="blue" />
                  <StatCard title="Daily Transactions" value="N/A" change="" icon={Activity} color="purple" />
                </div>
              </div>
            )}

            {/* Financials (DeFi/L1) */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-2">Financials</h3>
              <div className="grid grid-cols-1 gap-4">
                <StatCard 
                  title="Total Value Locked (TVL)" 
                  value={tokenDetails?.market_data?.tvl ? formatNumber(tokenDetails.market_data.tvl) : 'N/A'} 
                  change="" 
                  icon={Wallet} 
                  color="green" 
                />
                {isDeFi && (
                  <StatCard title="Protocol Revenue (24h)" value="N/A" change="" icon={BarChart2} color="yellow" />
                )}
              </div>
            </div>

            {/* Holder Analytics (All) */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-2">Holder Analytics</h3>
              <div className="grid grid-cols-1 gap-4">
                <StatCard title="Exchange Net Flow (24h)" value="N/A" change="" icon={ArrowRightLeft} color="red" />
                <StatCard title="Whale Transactions (>100k)" value="N/A" change="" icon={Fish} color="indigo" />
              </div>
            </div>
            
            <div className="text-xs text-gray-600 text-center mt-4">
              Data Source: DefiLlama & CryptoCompare
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-800">
              <h3 className="text-sm font-bold text-white mb-2">About {tokenDetails?.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Rank</div>
                  <div className="text-white">#{tokenDetails?.market_cap_rank || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Sector</div>
                  <div className="text-white">{category}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">Links</h3>
              <div className="space-y-2">
                {tokenDetails?.links?.homepage?.[0] && (
                  <a href={tokenDetails.links.homepage[0]} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                    <span className="flex items-center text-gray-300"><Globe size={16} className="mr-2" /> Website</span>
                    <ExternalLink size={14} className="text-gray-500" />
                  </a>
                )}
                {tokenDetails?.links?.twitter_screen_name && (
                  <a href={`https://twitter.com/${tokenDetails.links.twitter_screen_name}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                    <span className="flex items-center text-gray-300"><Twitter size={16} className="mr-2" /> Twitter</span>
                    <ExternalLink size={14} className="text-gray-500" />
                  </a>
                )}
                {tokenDetails?.links?.whitepaper && (
                  <a href={tokenDetails.links.whitepaper} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                    <span className="flex items-center text-gray-300"><FileText size={16} className="mr-2" /> Whitepaper</span>
                    <ExternalLink size={14} className="text-gray-500" />
                  </a>
                )}
                <a href={`https://www.coingecko.com/en/coins/${tokenDetails?.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <span className="flex items-center text-gray-300"><img src="https://static.coingecko.com/s/thumbnail-d5a7c1de76b4bc1332e4f897dc1fa183.png" className="w-4 h-4 mr-2 grayscale opacity-70" /> CoinGecko</span>
                  <ExternalLink size={14} className="text-gray-500" />
                </a>
              </div>
            </div>

            {/* Contract Address */}
            {tokenDetails?.platforms?.ethereum && (
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Contract</h3>
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex items-center justify-between">
                  <div className="truncate text-xs text-gray-400 font-mono mr-2">
                    {tokenDetails.platforms.ethereum}
                  </div>
                  <button 
                    className="text-gray-500 hover:text-white"
                    onClick={() => navigator.clipboard.writeText(tokenDetails.platforms.ethereum)}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetailPanel;