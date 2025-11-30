import React, { useEffect, useRef } from 'react';
import { useCoinDetails, useCoinMarketChart } from '../../hooks/useMarketData';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import { Pin, X, Activity, Users, Wallet, BarChart2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const HoverCard = ({ tokenId, position, onClose, isPinned, onPin, data }) => {
  const { t } = useTranslation();
  const { data: tokenDetails, isLoading: isDetailsLoading } = useCoinDetails(tokenId);

  const { data: marketChart, isLoading: isChartLoading } = useCoinMarketChart(tokenId, 7); // 7 days for mini chart
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  // Initialize Mini Chart
  useEffect(() => {
    if (!marketChart || !chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      width: chartContainerRef.current.clientWidth,
      height: 96,
      timeScale: {
        visible: false,
        borderVisible: false,
      },
      rightPriceScale: {
        visible: false,
        borderVisible: false,
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: tokenDetails?.market_data?.price_change_percentage_24h >= 0 ? '#22c55e' : '#ef4444',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
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
        chart.timeScale().fitContent();
      }
    }

    chartRef.current = chart;

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [marketChart, tokenDetails]);

  if (!tokenDetails && isDetailsLoading) {
    return (
      <div
        className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 w-80 h-40 flex items-center justify-center pointer-events-none"
        style={{ left: position.x, top: position.y }}
      >
        <div className="text-blue-500 animate-pulse">{t('app.loading')}</div>
      </div>
    );
  }

  if (!tokenDetails) return null;

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toLocaleString()}`;
  };

  const formatSupply = (num) => {
    if (!num) return 'N/A';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  return (
    <div
      className={clsx(
        "absolute z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-80 overflow-hidden flex flex-col transition-opacity duration-200",
        isPinned ? "border-blue-500 ring-1 ring-blue-500" : ""
      )}
      style={{ left: position.x, top: position.y }}
    >
      {/* Section 1: Core Info */}
      <div className="p-3 bg-gray-800/50 border-b border-gray-700">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <img src={tokenDetails.image?.large} alt={tokenDetails.name} className="w-8 h-8 rounded-full" />
            <div>
              <div className="font-bold text-white text-sm flex items-center">
                {tokenDetails.name}
                <span className="text-gray-400 ml-1 text-xs">({tokenDetails.symbol.toUpperCase()})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-mono font-medium">
                  ${tokenDetails.market_data?.current_price?.usd?.toLocaleString()}
                </span>
                <span className={clsx(
                  "text-xs font-medium",
                  tokenDetails.market_data?.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {tokenDetails.market_data?.price_change_percentage_24h > 0 ? '+' : ''}
                  {tokenDetails.market_data?.price_change_percentage_24h?.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            <button onClick={onPin} className={clsx("p-1 rounded hover:bg-gray-700 transition-colors", isPinned ? "text-blue-400" : "text-gray-400")}>
              <Pin size={14} className={isPinned ? "fill-current" : ""} />
            </button>
            {isPinned && (
              <button onClick={onClose} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-2">
          <div className="text-xs text-gray-400 mb-1">
            {t('detail_panel.market_cap')}: <span className="text-gray-200">{formatNumber(tokenDetails.market_data?.market_cap?.usd)}</span>
          </div>
        </div>
      </div>

      {/* Chart Section - Full Width */}
      <div className="p-3 border-b border-gray-700 bg-gray-900/50">
        <div className="w-full h-24" ref={chartContainerRef}></div>
      </div>

      {/* Section 2: Market Depth */}
      <div className="p-3 border-b border-gray-700 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
        <div>
          <div className="text-gray-500 mb-0.5">{t('detail_panel.volume_24h')}</div>
          <div className="text-gray-200 font-medium">{formatNumber(tokenDetails.market_data?.total_volume?.usd)}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-0.5">{t('detail_panel.fdv')}</div>
          <div className="text-gray-200 font-medium">{formatNumber(tokenDetails.market_data?.fdv)}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-0.5">{t('detail_panel.circulating_supply')}</div>
          <div className="text-gray-200 font-medium">{formatSupply(tokenDetails.market_data?.circulating_supply)}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-0.5">{t('detail_panel.total_supply')}</div>
          <div className="text-gray-200 font-medium">{formatSupply(tokenDetails.market_data?.total_supply)}</div>
        </div>
      </div>

      {/* Section 3: On-Chain Vitals */}
      <div className="p-3 bg-gray-800/20 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
        <div className="flex items-start space-x-1.5">
          <Users size={12} className="text-blue-400 mt-0.5" />
          <div>
            <div className="text-gray-500 mb-0.5">{t('detail_panel.daily_active_addresses')}</div>
            <div className="text-gray-200 font-medium">
              {tokenDetails.market_data?.dau ? tokenDetails.market_data.dau.toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
        <div className="flex items-start space-x-1.5">
          <Activity size={12} className="text-purple-400 mt-0.5" />
          <div>
            <div className="text-gray-500 mb-0.5">{t('detail_panel.daily_transactions')}</div>
            <div className="text-gray-200 font-medium">
              {tokenDetails.market_data?.txns_24h ? tokenDetails.market_data.txns_24h.toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
        <div className="flex items-start space-x-1.5">
          <Wallet size={12} className="text-green-400 mt-0.5" />
          <div>
            <div className="text-gray-500 mb-0.5">{t('detail_panel.tvl')}</div>
            <div className="text-gray-200 font-medium">{formatNumber(tokenDetails.market_data?.tvl)}</div>
          </div>
        </div>
        <div className="flex items-start space-x-1.5">
          <BarChart2 size={12} className="text-yellow-400 mt-0.5" />
          <div>
            <div className="text-gray-500 mb-0.5">{t('detail_panel.protocol_revenue')}</div>
            <div className="text-gray-200 font-medium">{formatNumber(tokenDetails.market_data?.revenue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoverCard;