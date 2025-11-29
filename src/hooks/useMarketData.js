import { useQuery } from '@tanstack/react-query';
import { fetchMarketData, fetchCoinDetails, fetchCoinMarketChart, fetchCoinGeneralInfo, fetchProtocolTVL } from '../api/client';
import { getDefiLlamaSlug } from '../lib/utils';

// Helper to normalize CryptoCompare data to our app's expected format
const normalizeCoinData = (coin) => {
  const raw = coin.RAW?.USD || {};
  const info = coin.CoinInfo || {};
  
  return {
    id: info.Name?.toLowerCase() || 'unknown', // CryptoCompare uses Symbol as ID mostly
    symbol: info.Name?.toLowerCase() || '',
    name: info.FullName || '',
    image: `https://www.cryptocompare.com${info.ImageUrl}`,
    current_price: raw.PRICE || 0,
    market_cap: raw.MKTCAP || 0,
    market_cap_rank: 0, // CryptoCompare doesn't give explicit rank in this endpoint, we can infer from index
    total_volume: raw.TOTALVOLUME24H || 0,
    price_change_percentage_24h: raw.CHANGEPCT24HOUR || 0,
    price_change_percentage_1h_in_currency: raw.CHANGEPCTHOUR || 0, // Available in full data
    price_change_percentage_7d_in_currency: 0, // Not directly available in this endpoint, would need history
  };
};

// Hook for Global Market Data
export const useGlobalData = () => {
  // We will derive global data from the top 100 coins fetch to save requests
  const { data: marketData, isLoading, error } = useMarketData();
  
  const globalData = {
    data: {
      total_market_cap: { usd: 0 },
      total_volume: { usd: 0 },
      market_cap_percentage: { btc: 0, eth: 0 },
      market_cap_change_percentage_24h_usd: 0
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
    
    // Rough estimate of market change based on weighted average of top coins could be calculated here
    // but for now we'll leave it as 0 or calculate a simple average
  }

  return { data: globalData, isLoading, error };
};

// Hook for Market Data (Coins List)
export const useMarketData = (currency = 'USD', limit = 100) => {
  return useQuery({
    queryKey: ['marketData', currency, limit],
    queryFn: async () => {
      try {
        const data = await fetchMarketData(currency, limit);
        console.log('[DEBUG_TREEMAP] Fetched Market Data (Raw):', data?.length, data?.[0]); // Debug log
        if (!data || !Array.isArray(data)) {
          console.warn('[DEBUG_TREEMAP] Market Data is not an array:', data);
          return [];
        }
        const normalized = data.map(normalizeCoinData);
        console.log('[DEBUG_TREEMAP] Normalized Data (First Item):', normalized[0]);
        return normalized;
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
      
      // Fetch TVL if applicable
      const defiSlug = getDefiLlamaSlug(symbol);
      const tvlPromise = defiSlug ? fetchProtocolTVL(defiSlug) : Promise.resolve(null);

      const [priceData, generalInfoData, tvlData] = await Promise.all([priceDataPromise, generalInfoPromise, tvlPromise]);

      const raw = priceData.RAW?.[symbol]?.USD || {};
      const display = priceData.DISPLAY?.[symbol]?.USD || {};
      const info = generalInfoData?.Data?.[0]?.CoinInfo || {};
      
      // Normalize to match CoinGecko structure expected by TokenDetailPanel
      return {
        id: symbol.toLowerCase(),
        name: info.FullName || symbol, 
        symbol: symbol.toLowerCase(),
        image: { large: `https://www.cryptocompare.com${display.IMAGEURL}` },
        market_data: {
          current_price: { usd: raw.PRICE },
          market_cap: { usd: raw.MKTCAP },
          total_volume: { usd: raw.TOTALVOLUME24H },
          price_change_percentage_24h: raw.CHANGEPCT24HOUR,
          circulating_supply: raw.SUPPLY,
          total_supply: raw.SUPPLY, // CryptoCompare often just gives SUPPLY. We can use it as total for now.
          fdv: raw.PRICE * raw.SUPPLY, // Calculate FDV
          tvl: tvlData ? tvlData.tvl : null, // Add TVL if available
          tvl_change_24h: null // DefiLlama simple endpoint might not give change directly without history
        },
        market_cap_rank: 0, // Not available
        links: { 
          homepage: info.WebsiteUrl ? [info.WebsiteUrl] : [],
          twitter_screen_name: info.Twitter ? info.Twitter.replace('@', '') : '', // CryptoCompare might return handle
          telegram_channel_identifier: '', // Not always available
          whitepaper: info.WhitepaperUrl || ''
        },
        platforms: {}
      };
    },
    enabled: !!coinId,
    staleTime: 300000, // 5 minutes
  });
};

// Hook for Coin Market Chart
export const useCoinMarketChart = (coinId, days = 1) => {
  const symbol = coinId ? coinId.toUpperCase() : null;
  // CryptoCompare history limit is by count, not days directly. 
  // 1 day = 24 hours. 7 days = 168 hours.
  const limit = days === 1 ? 24 : 168; 

  return useQuery({
    queryKey: ['coinMarketChart', symbol, limit],
    queryFn: async () => {
      if (!symbol) return { prices: [] };
      const data = await fetchCoinMarketChart(symbol, limit);
      // Normalize to [timestamp, price] format
      const prices = data.map(item => [item.time * 1000, item.close]);
      return { prices };
    },
    enabled: !!coinId,
    staleTime: 60000, // 1 minute
  });
};