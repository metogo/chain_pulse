import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, FileText, Twitter, MessageCircle, Compass, Copy, ExternalLink, TrendingUp, Activity, Users, GitCommit, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCoinDetails, useCoinMarketChart, useFearAndGreedIndex, useMarketData, useOnChainAnalytics, useInfluenceMetrics } from '../hooks/useMarketData';
import { clsx } from 'clsx';
import { getCoinCategory, COIN_CATEGORIES } from '../lib/utils';
import ProfessionalChart from '../features/Chart/ProfessionalChart';
import FlashValue from '../components/FlashValue';

const FearGreedModule = () => {
  const { data: fng, isLoading } = useFearAndGreedIndex();
  const { t } = useTranslation();

  if (isLoading || !fng) return <div className="animate-pulse h-32 bg-gray-800 rounded-lg"></div>;

  const value = parseInt(fng.value);
  const classification = fng.value_classification;
  
  let color = 'text-gray-400';
  if (value <= 25) color = 'text-red-500';
  else if (value <= 45) color = 'text-orange-500';
  else if (value <= 55) color = 'text-gray-400';
  else if (value <= 75) color = 'text-green-400';
  else color = 'text-green-500';

  return (
    <div className="bg-gray-800/30 border border-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('asset_page.market_sentiment')}</h3>
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-16 overflow-hidden mb-2">
           <div className="absolute top-0 left-0 w-full h-full bg-gray-700 rounded-t-full"></div>
           <div 
             className={`absolute top-0 left-0 w-full h-full rounded-t-full origin-bottom transition-transform duration-1000 ease-out`}
             style={{ 
               transform: `rotate(${(value / 100) * 180 - 180}deg)`,
               backgroundColor: value > 50 ? '#22c55e' : '#ef4444'
             }}
           ></div>
        </div>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className={`text-sm font-medium ${color}`}>{classification}</div>
      </div>
    </div>
  );
};

const RelatedAssetsModule = ({ currentSymbol }) => {
  const category = getCoinCategory(currentSymbol);
  const { data: marketData } = useMarketData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const relatedAssets = marketData?.filter(coin => {
    const coinCat = getCoinCategory(coin.symbol);
    return coinCat === category && coin.symbol.toLowerCase() !== currentSymbol?.toLowerCase();
  }).slice(0, 5) || [];

  if (relatedAssets.length === 0) return null;

  return (
    <div className="bg-gray-800/30 border border-gray-800 rounded-lg p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('asset_page.related_assets')} ({category})</h3>
      <div className="space-y-3">
        {relatedAssets.map(asset => (
          <div 
            key={asset.id} 
            onClick={() => navigate(`/asset/${asset.id}`)}
            className="flex items-center justify-between cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors"
          >
            <div className="flex items-center">
              <img src={asset.image} alt={asset.name} className="w-6 h-6 rounded-full mr-2" />
              <div>
                <div className="text-sm font-medium text-white">{asset.symbol.toUpperCase()}</div>
                <div className="text-xs text-gray-500">${asset.current_price.toLocaleString()}</div>
              </div>
            </div>
            <div className={`text-xs font-medium ${asset.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {asset.price_change_percentage_24h >= 0 ? '+' : ''}{asset.price_change_percentage_24h.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AssetPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data: tokenDetails, isLoading: isDetailsLoading } = useCoinDetails(id);
  const [chartDays, setChartDays] = useState(1);
  const [currency, setCurrency] = useState('USD');
  const { data: marketChart, isLoading: isChartLoading } = useCoinMarketChart(id, chartDays);
  const [activeTab, setActiveTab] = useState('overview');
  
  // New Hooks for Analytics
  const { data: onChainData } = useOnChainAnalytics(id);
  const { data: influenceData } = useInfluenceMetrics(id);

  const formatCurrency = (val) => {
    if (!val) return '$0.00';
    return val < 1 ? `$${val.toFixed(6)}` : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatLargeNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  if (isDetailsLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-950 text-white">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-white overflow-hidden font-sans">
      {/* Left Sidebar: Identity & Profile */}
      <aside className="w-[280px] flex-none border-r border-gray-800 bg-gray-900/50 flex flex-col overflow-y-auto">
        <div className="p-6">
          <Link to="/" className="flex items-center text-gray-400 hover:text-white transition-colors mb-8 group">
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            {t('asset_page.back_to_market')}
          </Link>
          
          {/* Identity Card */}
          <div className="mb-8 text-center">
            <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-gray-800 shadow-lg">
               {tokenDetails?.image?.large ? (
                 <img src={tokenDetails.image.large} alt={tokenDetails.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-4xl font-bold text-gray-600">{tokenDetails?.symbol?.toUpperCase()}</span>
               )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{tokenDetails?.name}</h1>
            <div className="text-gray-400 font-mono bg-gray-800/50 inline-block px-2 py-1 rounded text-sm">{tokenDetails?.symbol?.toUpperCase()}</div>
          </div>

          {/* Official Links */}
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('asset_page.official_links')}</h3>
             <div className="grid grid-cols-4 gap-2">
                {tokenDetails?.links?.homepage?.[0] && (
                  <a href={tokenDetails.links.homepage[0]} target="_blank" rel="noreferrer" className="flex items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white" title={t('detail_panel.website')}>
                    <Globe size={20} />
                  </a>
                )}
                {tokenDetails?.links?.whitepaper && (
                  <a href={tokenDetails.links.whitepaper} target="_blank" rel="noreferrer" className="flex items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white" title={t('detail_panel.whitepaper')}>
                    <FileText size={20} />
                  </a>
                )}
                {tokenDetails?.links?.twitter_screen_name && (
                  <a href={`https://twitter.com/${tokenDetails.links.twitter_screen_name}`} target="_blank" rel="noreferrer" className="flex items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white" title={t('detail_panel.twitter')}>
                    <Twitter size={20} />
                  </a>
                )}
                <a href={`https://www.coingecko.com/en/coins/${tokenDetails?.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white" title={t('detail_panel.coingecko')}>
                   <img src="https://static.coingecko.com/s/thumbnail-d5a7c1de76b4bc1332e4f897dc1fa183.png" className="w-5 h-5 grayscale opacity-70" />
                </a>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-gray-950">
        {/* Asset Header */}
        <div className="flex-none border-b border-gray-800 p-6 bg-gray-900/20">
           <div className="flex items-start justify-between mb-6">
             <div>
               <div className="flex items-baseline space-x-3 mb-2">
                 <FlashValue value={tokenDetails?.market_data?.current_price?.usd} className="text-5xl font-bold text-white tracking-tight">
                   {formatCurrency(tokenDetails?.market_data?.current_price?.usd)}
                 </FlashValue>
                 <select
                   value={currency}
                   onChange={(e) => setCurrency(e.target.value)}
                   className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1"
                 >
                   <option value="USD">USD</option>
                   <option value="CNY">CNY</option>
                 </select>
               </div>
               <FlashValue value={tokenDetails?.market_data?.price_change_percentage_24h} className={clsx("flex items-center text-lg font-medium", tokenDetails?.market_data?.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500")}>
                 {tokenDetails?.market_data?.price_change_percentage_24h >= 0 ? '+' : ''}
                 {tokenDetails?.market_data?.price_change_percentage_24h?.toFixed(2)}% (24h)
               </FlashValue>
             </div>
             
             {/* Timeframe Selector */}
             <div className="flex bg-gray-800 rounded-lg p-1 space-x-1 self-end">
                {[1, 7, 30, 365].map((d) => (
                  <button
                    key={d}
                    onClick={() => setChartDays(d)}
                    className={clsx(
                      "px-3 py-1 text-sm font-medium rounded transition-colors",
                      chartDays === d ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                    )}
                  >
                    {d === 1 ? '1D' : d === 7 ? '7D' : d === 30 ? '1M' : '1Y'}
                  </button>
                ))}
             </div>
           </div>

           {/* Key Metrics Bar */}
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-4 border-t border-gray-800/50">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('detail_panel.market_cap')}</div>
                <div className="font-medium text-white">{formatLargeNumber(tokenDetails?.market_data?.market_cap?.usd)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('detail_panel.volume_24h')}</div>
                <div className="font-medium text-white">{formatLargeNumber(tokenDetails?.market_data?.total_volume?.usd)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('detail_panel.fdv')}</div>
                <div className="font-medium text-white">{formatLargeNumber(tokenDetails?.market_data?.fdv)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('detail_panel.circulating_supply')}</div>
                <div className="font-medium text-white">{formatLargeNumber(tokenDetails?.market_data?.circulating_supply)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('asset_page.high_low_24h')}</div>
                <div className="font-medium text-white text-xs">
                  {formatLargeNumber(tokenDetails?.market_data?.high_24h)} / {formatLargeNumber(tokenDetails?.market_data?.low_24h)}
                </div>
              </div>
              {tokenDetails?.market_data?.tvl && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('detail_panel.tvl')}</div>
                  <div className="font-medium text-green-400">{formatLargeNumber(tokenDetails?.market_data?.tvl)}</div>
                </div>
              )}
           </div>
        </div>

        {/* Chart Area */}
        <div className="flex-none h-[500px] relative bg-gray-950 flex flex-col border-b border-gray-800">
           {isChartLoading ? (
             <div className="absolute inset-0 flex items-center justify-center text-gray-500">
               Loading Chart...
             </div>
           ) : (
             <ProfessionalChart 
               data={marketChart?.prices} 
               lineColor={tokenDetails?.market_data?.price_change_percentage_24h >= 0 ? '#22c55e' : '#ef4444'}
               topColor={tokenDetails?.market_data?.price_change_percentage_24h >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
               bottomColor={tokenDetails?.market_data?.price_change_percentage_24h >= 0 ? 'rgba(34, 197, 94, 0.0)' : 'rgba(239, 68, 68, 0.0)'}
             />
           )}
        </div>

        {/* Deep Data Tabs */}
        <div className="flex-1 border-t border-gray-800 bg-gray-900/30 flex flex-col min-h-0">
           <div className="flex border-b border-gray-800 px-6 flex-none">
             <button 
               onClick={() => setActiveTab('overview')}
               className={clsx("px-6 py-4 text-sm font-medium border-b-2 transition-colors", activeTab === 'overview' ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white")}
             >
               {t('asset_page.overview')}
             </button>
             <button
               onClick={() => setActiveTab('analysis')}
               className={clsx("px-6 py-4 text-sm font-medium border-b-2 transition-colors", activeTab === 'analysis' ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white")}
             >
               {t('asset_page.analysis')}
             </button>
             <button
               onClick={() => setActiveTab('influence')}
               className={clsx("px-6 py-4 text-sm font-medium border-b-2 transition-colors", activeTab === 'influence' ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white")}
             >
               {t('asset_page.influence')}
             </button>
           </div>
           <div className="p-6">
             {activeTab === 'overview' && (
               <div className="max-w-3xl">
                 <h3 className="text-lg font-bold text-white mb-4">{t('asset_page.about')} {tokenDetails?.name}</h3>
                 <p className="text-gray-400 leading-relaxed mb-6">
                   {tokenDetails?.name} ({tokenDetails?.symbol?.toUpperCase()}) is a cryptocurrency...
                   (Description placeholder: This asset is a key player in the crypto ecosystem.)
                 </p>
                 
                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <h4 className="text-sm font-bold text-gray-300 mb-2">{t('asset_page.key_data')}</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between border-b border-gray-800 pb-1">
                         <span className="text-gray-500">{t('asset_page.genesis_date')}</span>
                         <span className="text-white">N/A</span>
                       </div>
                       <div className="flex justify-between border-b border-gray-800 pb-1">
                         <span className="text-gray-500">{t('asset_page.consensus')}</span>
                         <span className="text-white">N/A</span>
                       </div>
                     </div>
                   </div>
                   <div>
                     <h4 className="text-sm font-bold text-gray-300 mb-2">{t('asset_page.tags')}</h4>
                     <div className="flex flex-wrap gap-2">
                       <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">Cryptocurrency</span>
                       {tokenDetails?.market_data?.tvl && <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">DeFi</span>}
                     </div>
                   </div>
                 </div>
               </div>
             )}
             {activeTab === 'analysis' && (
               <div className="grid grid-cols-2 gap-6">
                 <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-800">
                   <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center"><Activity size={16} className="mr-2 text-blue-400"/> {t('asset_page.on_chain_activity')}</h4>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                       <div className="text-xs text-gray-500">{t('asset_page.new_addresses_24h')}</div>
                       <div className="text-lg font-bold text-white">{onChainData?.new_addresses_24h?.toLocaleString() || 'N/A'}</div>
                     </div>
                     <div>
                       <div className="text-xs text-gray-500">{t('asset_page.large_tx_count_24h')}</div>
                       <div className="text-lg font-bold text-white">{onChainData?.large_tx_count_24h?.toLocaleString() || 'N/A'}</div>
                     </div>
                   </div>
                   <div className="h-32 bg-gray-900/50 rounded flex items-center justify-center text-xs text-gray-600">
                     {t('asset_page.active_addresses_chart_placeholder')}
                   </div>
                 </div>
                 <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-800">
                   <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center"><Users size={16} className="mr-2 text-purple-400"/> {t('asset_page.holder_analysis')}</h4>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                       <div className="text-xs text-gray-500">{t('asset_page.whale_holdings')}</div>
                       <div className="text-lg font-bold text-white">{onChainData?.whale_holdings_percent}%</div>
                     </div>
                     <div>
                       <div className="text-xs text-gray-500">{t('asset_page.avg_tx_value')}</div>
                       <div className="text-lg font-bold text-white">${onChainData?.avg_tx_value_24h?.toLocaleString() || 'N/A'}</div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
             {activeTab === 'influence' && (
               <div className="grid grid-cols-2 gap-6">
                 <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-800">
                   <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center"><GitCommit size={16} className="mr-2 text-green-400"/> {t('asset_page.development_activity')}</h4>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                       <div className="text-xs text-gray-500">{t('asset_page.contributors_30d')}</div>
                       <div className="text-lg font-bold text-white">{influenceData?.contributors_30d || 'N/A'}</div>
                     </div>
                     <div>
                       <div className="text-xs text-gray-500">{t('asset_page.github_stars')}</div>
                       <div className="text-lg font-bold text-white">{influenceData?.stars?.toLocaleString() || 'N/A'}</div>
                     </div>
                   </div>
                   <div className="h-32 bg-gray-900/50 rounded flex items-center justify-center text-xs text-gray-600">
                     {t('asset_page.commits_chart_placeholder')}
                   </div>
                 </div>
                 <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-800">
                   <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center"><Share2 size={16} className="mr-2 text-pink-400"/> {t('asset_page.social_influence')}</h4>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                       <div className="text-xs text-gray-500">{t('asset_page.sentiment')}</div>
                       <div className="text-lg font-bold text-green-400">{influenceData?.social_sentiment_positive_percent}% {t('asset_page.positive')}</div>
                     </div>
                     <div>
                       <div className="text-xs text-gray-500">{t('asset_page.dominance')}</div>
                       <div className="text-lg font-bold text-white">{influenceData?.social_dominance_percent}%</div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
           </div>
        </div>
      </main>

      {/* Right Sidebar: Context */}
      <aside className="w-[320px] flex-none border-l border-gray-800 bg-gray-900/50 hidden xl:block overflow-y-auto">
        <div className="p-6">
          <FearGreedModule />
          <RelatedAssetsModule currentSymbol={tokenDetails?.symbol} />
        </div>
      </aside>
    </div>
  );
};

export default AssetPage;