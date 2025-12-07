import React, { useState, useMemo } from 'react';
import { useMarketData } from '../../hooks/useMarketData';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { generateSparklinePath } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const DataListView = () => {
  const { data: marketData, isLoading } = useMarketData();
  const { selectToken } = useAppStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState({ key: 'market_cap', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!marketData) return [];
    const data = [...marketData];
    
    return data.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested or special keys if needed
      if (sortConfig.key === 'rank') {
        aValue = a.market_cap_rank;
        bValue = b.market_cap_rank;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [marketData, sortConfig]);

  const formatCurrency = (val) => {
    if (!val) return '$0.00';
    return val < 1 ? `$${val.toFixed(6)}` : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatLargeNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1.0e+9) return `$${(num / 1.0e+9).toFixed(2)}B`;
    if (num >= 1.0e+6) return `$${(num / 1.0e+6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 text-gray-600" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="ml-1 text-blue-500" />
      : <ArrowDown size={12} className="ml-1 text-blue-500" />;
  };

  const HeaderCell = ({ label, columnKey, className }) => (
    <th 
      className={clsx("px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors", className)}
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-blue-500 animate-pulse">{t('app.loading')}</div>;
  }

  return (
    <div className="w-full h-full overflow-auto bg-gray-950">
      <table className="min-w-full divide-y divide-gray-800">
        <thead className="bg-gray-900 sticky top-0 z-10">
          <tr>
            <HeaderCell label="#" columnKey="rank" className="w-16" />
            <HeaderCell label={t('table.coin') || 'Coin'} columnKey="name" />
            <HeaderCell label={t('table.price') || 'Price'} columnKey="current_price" className="text-right justify-end" />
            <HeaderCell label="24h %" columnKey="price_change_percentage_24h" className="text-right justify-end" />
            <HeaderCell label={t('table.market_cap') || 'Market Cap'} columnKey="market_cap" className="text-right justify-end" />
            <HeaderCell label={t('table.volume') || 'Volume'} columnKey="total_volume" className="text-right justify-end" />
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-32">
              {t('table.last_7d') || 'Last 7 Days'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-gray-950">
          {sortedData.map((coin, index) => {
            const isPositive = coin.price_change_percentage_24h >= 0;
            const sparklineData = coin.sparkline_in_7d?.price || [];
            const sparklinePath = generateSparklinePath(sparklineData, 100, 30);
            const sparklineColor = isPositive ? '#22c55e' : '#ef4444';

            return (
              <tr
                key={coin.id}
                onClick={() => navigate(`/asset/${coin.id}`)}
                className="hover:bg-gray-900/50 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {coin.market_cap_rank}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <img className="h-6 w-6 rounded-full mr-3" src={coin.image} alt="" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{coin.name}</span>
                      <span className="text-xs text-gray-500">{coin.symbol.toUpperCase()}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-white text-right font-mono">
                  {formatCurrency(coin.current_price)}
                </td>
                <td className={clsx("px-4 py-3 whitespace-nowrap text-sm text-right font-medium", isPositive ? "text-green-500" : "text-red-500")}>
                  {isPositive ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                  {formatLargeNumber(coin.market_cap)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                  {formatLargeNumber(coin.total_volume)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="w-24 h-8 ml-auto">
                    <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <path d={sparklinePath} fill="none" stroke={sparklineColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataListView;