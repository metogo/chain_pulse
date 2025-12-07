import { useQuery } from '@tanstack/react-query';
import { fetchMarketData, fetchCoinDetails, fetchCoinMarketChart, fetchCoinGeneralInfo, fetchProtocolTVL, fetchProtocolFees, fetchBlockchairStats, fetchGasPrice, fetchFearAndGreedIndex, fetchOnChainAnalytics, fetchInfluenceMetrics, fetchMarketBreadthData, fetchLongShortRatio, fetchGlobalDeFiTVL } from '../api/client';
import { getDefiLlamaSlug } from '../lib/utils';

// Helper to normalize CoinGecko data to our app's expected format
const normalizeCoinData = (coin, index) => {
  // Check if it's CoinGecko data (has id, symbol, name directly) or CryptoCompare (has RAW/CoinInfo)
  if (coin.id && coin.symbol && coin.name && coin.market_cap !== undefined) {
    // CoinGecko Data
    return {
      id: coin.symbol.toLowerCase(), // Use symbol as ID for CryptoCompare compatibility
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      total_volume: coin.total_volume,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
      price_change_percentage_1h_in_currency: coin.price_change_percentage_1h_in_currency || 0,
      price_change_percentage_7d_in_currency: coin.price_change_percentage_7d_in_currency || 0,
      sparkline_in_7d: coin.sparkline_in_7d || { price: [] },
    };
  } else {
    // CryptoCompare Data (Fallback)
    const raw = coin.RAW?.USD || {};
    const info = coin.CoinInfo || {};
    
    return {
      id: info.Name?.toLowerCase() || 'unknown',
      symbol: info.Name?.toLowerCase() || '',
      name: info.FullName || '',
      image: `https://www.cryptocompare.com${info.ImageUrl}`,
      current_price: raw.PRICE || 0,
      market_cap: raw.MKTCAP || 0,
      market_cap_rank: index + 1,
      total_volume: raw.TOTALVOLUME24H || 0,
      price_change_percentage_24h: raw.CHANGEPCT24HOUR || 0,
      price_change_percentage_1h_in_currency: raw.CHANGEPCTHOUR || 0,
      price_change_percentage_7d_in_currency: 0,
      sparkline_in_7d: { price: [] }, // Fallback for CryptoCompare
    };
  }
};

// Hook for Global Market Data
export const useGlobalData = () => {
  // We will derive global data from the top 100 coins fetch to save requests
  const { data: marketData, isLoading, error } = useMarketData();
  const { data: gasPrice } = useGasPrice();
  
  const globalData = {
    data: {
      total_market_cap: { usd: 0 },
      total_volume: { usd: 0 },
      market_cap_percentage: { btc: 0, eth: 0 },
      market_cap_change_percentage_24h_usd: 0,
      gas_price: gasPrice
    }
  };

  if (marketData && marketData.length > 0) {
    const totalCap = marketData.reduce((acc, coin) => acc + coin.market_cap, 0);
    const totalVol = marketData.reduce((acc, coin) => acc + coin.total_volume, 0);
    const btc = marketData.find(c => c.symbol === 'btc');
    const eth = marketData.find(c => c.symbol === 'eth');

    globalData.data.total_market_cap.usd = totalCap;
    globalData.data.total_volume.usd = totalVol;
    if (btc) globalData.data.market_cap_percentage.btc = (btc.market_cap / totalCap) * 100;
    if (eth) globalData.data.market_cap_percentage.eth = (eth.market_cap / totalCap) * 100;
  }

  return { data: globalData, isLoading, error };
};

// Hook for Gas Price
export const useGasPrice = () => {
  return useQuery({
    queryKey: ['gasPrice'],
    queryFn: fetchGasPrice,
    refetchInterval: 30000, // 30 seconds
  });
};

// Hook for Market Data (Coins List)
export const useMarketData = (currency = 'USD', limit = 100, category = null) => {
  return useQuery({
    queryKey: ['marketData', currency, limit, category],
    queryFn: async () => {
      try {
        const data = await fetchMarketData(currency, limit, category);
        console.log('[DEBUG_TREEMAP] Fetched Market Data (Raw):', data?.length, data?.[0]); // Debug log
        if (!data || !Array.isArray(data)) {
          console.warn('[DEBUG_TREEMAP] Market Data is not an array:', data);
          return [];
        }
        const normalized = data.map((coin, index) => normalizeCoinData(coin, index));
        
        // Deduplicate based on ID to prevent key collisions
        const uniqueData = Array.from(new Map(normalized.map(item => [item.id, item])).values());

        console.log('[DEBUG_TREEMAP] Normalized Data (First Item):', uniqueData[0]);
        return uniqueData;
      } catch (err) {
        console.error('[DEBUG_TREEMAP] Error fetching market data:', err);
        throw err;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Hook for Coin Details
export const useCoinDetails = (coinId) => {
  // CryptoCompare uses Symbol (e.g., BTC) for queries, but our app uses ID (e.g., bitcoin)
  // We need to map or pass the symbol. For now, let's assume coinId passed here is actually the symbol 
  // because we normalized it to be the symbol in normalizeCoinData (id: info.Name.toLowerCase())
  
  const symbol = coinId ? coinId.toUpperCase() : null;

  return useQuery({
    queryKey: ['coinDetails', symbol],
    queryFn: async () => {
      if (!symbol) return null;
      
      // Fetch Price/Supply Data
      const priceDataPromise = fetchCoinDetails(symbol);
      // Fetch General Info (Links, etc.)
      const generalInfoPromise = fetchCoinGeneralInfo(symbol);
      
      // Fetch TVL and Fees if applicable
      const defiSlug = getDefiLlamaSlug(symbol);
      const tvlPromise = defiSlug ? fetchProtocolTVL(defiSlug) : Promise.resolve(null);
      const feesPromise = defiSlug ? fetchProtocolFees(defiSlug) : Promise.resolve(null);

      // Fetch Blockchair Stats if applicable (L1s)
      const blockchairPromise = fetchBlockchairStats(symbol);

      const [priceDataResult, generalInfoResult, tvlResult, feesResult, blockchairResult] = await Promise.allSettled([
        priceDataPromise,
        generalInfoPromise,
        tvlPromise,
        feesPromise,
        blockchairPromise
      ]);

      const priceData = priceDataResult.status === 'fulfilled' ? priceDataResult.value : {};
      const generalInfoData = generalInfoResult.status === 'fulfilled' ? generalInfoResult.value : {};
      const tvlData = tvlResult.status === 'fulfilled' ? tvlResult.value : null;
      const feesData = feesResult.status === 'fulfilled' ? feesResult.value : null;
      const blockchairData = blockchairResult.status === 'fulfilled' ? blockchairResult.value : null;

      console.log('[DEBUG_DETAILS] General Info:', generalInfoData);
      console.log('[DEBUG_DETAILS] Blockchair Data:', blockchairData);
      console.log('[DEBUG_DETAILS] Fees Data:', feesData);

      const raw = priceData.RAW?.[symbol]?.USD || {};
      const display = priceData.DISPLAY?.[symbol]?.USD || {};
      const info = generalInfoData?.Data?.[0]?.CoinInfo || {};
      
      // Determine Data Sources
      const dataSources = ['CryptoCompare'];
      if (tvlData || feesData) dataSources.push('DefiLlama');
      if (blockchairData) dataSources.push('Blockchair');

      // Normalize to match CoinGecko structure expected by TokenDetailPanel
      return {
        id: symbol.toLowerCase(),
        name: info.FullName || symbol,
        symbol: symbol.toLowerCase(),
        image: { large: display.IMAGEURL ? `https://www.cryptocompare.com${display.IMAGEURL}` : null },
        market_data: {
          current_price: { usd: raw.PRICE || 0 },
          market_cap: { usd: raw.MKTCAP || 0 },
          total_volume: { usd: raw.TOTALVOLUME24H || 0 },
          price_change_percentage_24h: raw.CHANGEPCT24HOUR || 0,
          high_24h: raw.HIGH24HOUR || 0,
          low_24h: raw.LOW24HOUR || 0,
          circulating_supply: raw.SUPPLY || 0,
          total_supply: raw.SUPPLY || 0, // CryptoCompare often just gives SUPPLY. We can use it as total for now.
          fdv: (raw.PRICE && raw.SUPPLY) ? raw.PRICE * raw.SUPPLY : 0, // Calculate FDV
          tvl: tvlData ? tvlData.tvl : null, // Add TVL if available
          tvl_change_24h: null, // DefiLlama simple endpoint might not give change directly without history
          revenue: feesData?.total24h || null, // Add Revenue if available
          // On-chain stats
          block_time: info.BlockTime || null,
          net_hashes: info.NetHashesPerSecond || null,
          dau: blockchairData?.circulation?.daily_active_addresses || blockchairData?.hodling_addresses || null, // Fallback to hodling addresses if active not available, though not same
          txns_24h: blockchairData?.transactions_24h || null
        },
        market_cap_rank: 0, // Not available directly, but we could pass it if we had context, or just leave as 0/NA
        links: {
          homepage: info.WebsiteUrl ? [info.WebsiteUrl] : [],
          twitter_screen_name: info.Twitter ? info.Twitter.replace('@', '') : '', // CryptoCompare might return handle
          telegram_channel_identifier: '', // Not always available
          whitepaper: info.WhitepaperUrl || ''
        },
        platforms: {},
        data_sources: dataSources
      };
    },
    enabled: !!coinId,
    staleTime: 300000, // 5 minutes
  });
};

// Hook for Coin Market Chart
export const useCoinMarketChart = (coinId, days = 1) => {
  const symbol = coinId ? coinId.toUpperCase() : null;

  return useQuery({
    queryKey: ['coinMarketChart', symbol, days],
    queryFn: async () => {
      if (!symbol) return { prices: [] };
      const data = await fetchCoinMarketChart(symbol, days);
      // Normalize to [timestamp, price] format
      const prices = data.map(item => [item.time * 1000, item.close]);
      return { prices };
    },
    enabled: !!coinId,
    staleTime: 60000, // 1 minute
  });
};

// Hook for Fear and Greed Index
export const useFearAndGreedIndex = () => {
  return useQuery({
    queryKey: ['fearAndGreedIndex'],
    queryFn: fetchFearAndGreedIndex,
    staleTime: 3600000, // 1 hour
  });
};

// Hook for Long/Short Ratio
export const useLongShortRatio = (symbol = 'BTC') => {
  return useQuery({
    queryKey: ['longShortRatio', symbol],
    queryFn: () => fetchLongShortRatio(symbol),
    staleTime: 300000, // 5 minutes
  });
};

// Hook for Global DeFi TVL
export const useGlobalDeFiTVL = () => {
  return useQuery({
    queryKey: ['globalDeFiTVL'],
    queryFn: fetchGlobalDeFiTVL,
    staleTime: 3600000, // 1 hour
  });
};

// Hook for On-Chain Analytics
export const useOnChainAnalytics = (coinId) => {
  return useQuery({
    queryKey: ['onChainAnalytics', coinId],
    queryFn: () => fetchOnChainAnalytics(coinId),
    enabled: !!coinId,
    staleTime: 300000, // 5 minutes
  });
};

// Hook for Influence Metrics
export const useInfluenceMetrics = (coinId) => {
  return useQuery({
    queryKey: ['influenceMetrics', coinId],
    queryFn: () => fetchInfluenceMetrics(coinId),
    enabled: !!coinId,
    staleTime: 300000, // 5 minutes
  });
};

// Hook for Market Breadth
export const useMarketBreadth = () => {
  return useQuery({
    queryKey: ['marketBreadth'],
    queryFn: async () => {
      const data = await fetchMarketBreadthData();
      if (!data || !Array.isArray(data)) return null;

      let gainers = 0;
      let losers = 0;
      let unchanged = 0;

      data.forEach(coin => {
        if (coin.price_change_percentage_24h > 0) gainers++;
        else if (coin.price_change_percentage_24h < 0) losers++;
        else unchanged++;
      });

      return {
        gainers,
        losers,
        unchanged,
        total_tracked: data.length
      };
    },
    staleTime: 60000, // 1 minute
  });
};