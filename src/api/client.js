import axios from 'axios';

// CryptoCompare API Base URL
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data';
const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
const BLOCKCHAIR_BASE_URL = 'https://api.blockchair.com';
const ALTERNATIVE_ME_BASE_URL = 'https://api.alternative.me';
const BINANCE_FUTURES_BASE_URL = 'https://fapi.binance.com/futures/data';

// Create an axios instance for CryptoCompare
const api = axios.create({
  baseURL: CRYPTOCOMPARE_BASE_URL,
  timeout: 10000,
});

// Create an axios instance for DefiLlama
const llamaApi = axios.create({
  baseURL: DEFILLAMA_BASE_URL,
  timeout: 10000,
});

// Create an axios instance for Blockchair
const blockchairApi = axios.create({
  baseURL: BLOCKCHAIR_BASE_URL,
  timeout: 10000,
});

// Create an axios instance for Alternative.me
const alternativeApi = axios.create({
  baseURL: ALTERNATIVE_ME_BASE_URL,
  timeout: 10000,
});

// Create an axios instance for Binance Futures
const binanceApi = axios.create({
  baseURL: BINANCE_FUTURES_BASE_URL,
  timeout: 10000,
});

// Fetch Global Market Data (Total Market Cap, Volume)
export const fetchGlobalData = async () => {
  // This is a workaround as CryptoCompare's global data might require an API key for some endpoints.
  // We will fetch the top 100 coins and calculate the total market cap from them.
  // This is accurate enough for a "Sector Map" overview.
  return {}; // We will handle the aggregation in the hook
};

// Fetch Market Data (Top Coins by Market Cap)
export const fetchMarketData = async (currency = 'USD', limit = 100, category = null) => {
  // Using CoinGecko for better 7D change data
  try {
    const params = {
      vs_currency: currency.toLowerCase(),
      order: 'market_cap_desc',
      per_page: limit,
      page: 1,
      sparkline: true,
      price_change_percentage: '1h,24h,7d'
    };
    
    if (category) {
      params.category = category;
    }

    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: params,
    });
    return response.data;
  } catch (error) {
    console.warn('CoinGecko fetch failed, falling back to CryptoCompare', error);
    // Fallback to CryptoCompare
    const response = await api.get('/top/mktcapfull', {
      params: {
        limit: limit,
        tsym: currency,
      },
    });
    return response.data.Data;
  }
};

// Fetch Market Breadth Data (Top 250 for MVP to avoid rate limits)
export const fetchMarketBreadthData = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 250, // Fetch top 250
        page: 1,
        price_change_percentage: '24h'
      },
    });
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch market breadth data:', error);
    return [];
  }
};

// Fetch Coin Details (General Info)
export const fetchCoinDetails = async (coinSymbol) => {
  const response = await api.get('/pricemultifull', {
    params: {
      fsyms: coinSymbol,
      tsyms: 'USD',
    },
  });
  return response.data;
};

// Fetch Coin Market Chart (History)
export const fetchCoinMarketChart = async (coinSymbol, days = 1) => {
  let endpoint = '/v2/histohour';
  let limit = 168;
  let aggregate = 1;

  if (days === 1) {
    endpoint = '/v2/histominute';
    limit = 1440; // 1 day in minutes
    aggregate = 10; // 10 minute intervals -> 144 points
  } else if (days === 7) {
    endpoint = '/v2/histohour';
    limit = 168; // 7 days in hours
  } else if (days === 30) {
    endpoint = '/v2/histohour';
    limit = 720; // 30 days in hours
  } else if (days === 365) {
    endpoint = '/v2/histoday';
    limit = 365; // 365 days
  }

  const response = await api.get(endpoint, {
    params: {
      fsym: coinSymbol,
      tsym: 'USD',
      limit: limit,
      aggregate: aggregate
    },
  });
  return response.data.Data.Data;
};

// Fetch Coin General Info (for Links, Description, etc.)
export const fetchCoinGeneralInfo = async (coinSymbol) => {
  const response = await api.get('/coin/generalinfo', {
    params: {
      fsyms: coinSymbol,
      tsym: 'USD',
    },
  });
  return response.data.Data;
};

// Fetch Protocol TVL from DefiLlama
export const fetchProtocolTVL = async (protocolSlug) => {
  try {
    const response = await llamaApi.get(`/tvl/${protocolSlug}`);
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch TVL for ${protocolSlug}:`, error.message);
    return null;
  }
};

// Fetch Protocol Fees/Revenue from DefiLlama
export const fetchProtocolFees = async (protocolSlug) => {
  try {
    // Note: DefiLlama fees endpoint structure varies.
    // Using /overview/fees/{slug} with params to get daily fees/revenue
    const response = await llamaApi.get(`/overview/fees/${protocolSlug}`, {
      params: {
        excludeTotalDataChart: true,
        excludeTotalDataChartBreakdown: true,
        dataType: 'dailyFees'
      }
    });
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch fees for ${protocolSlug}:`, error.message);
    return null;
  }
};

// Fetch Gas Price (ETH)
export const fetchGasPrice = async () => {
  try {
    const response = await blockchairApi.get('/ethereum/stats');
    // Blockchair returns stats in data.data
    const stats = response.data.data;
    
    // Try to get suggested gas price (fast) first
    if (stats.suggested_transaction_fee_gwei_options?.fast) {
      return stats.suggested_transaction_fee_gwei_options.fast;
    }
    
    // Fallback to mempool median if available
    if (stats.mempool_median_gas_price) {
      return Math.round(stats.mempool_median_gas_price / 1000000000);
    }

    // Fallback to average_gas_price if available (old field)
    if (stats.average_gas_price) {
      return Math.round(stats.average_gas_price / 1000000000);
    }

    return null;
  } catch (error) {
    console.warn('Failed to fetch gas price:', error.message);
    return null;
  }
};

// Fetch Blockchair Stats (DAU/Txns) for supported chains
export const fetchBlockchairStats = async (chain) => {
  // Supported: bitcoin, ethereum, litecoin, dogecoin, etc.
  // Map symbol to blockchair chain name
  const chainMap = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'ltc': 'litecoin',
    'doge': 'dogecoin',
    'bch': 'bitcoin-cash',
  };
  
  const chainName = chainMap[chain.toLowerCase()];
  if (!chainName) return null;

  try {
    const response = await blockchairApi.get(`/${chainName}/stats`);
    return response.data.data;
  } catch (error) {
    console.warn(`Failed to fetch Blockchair stats for ${chain}:`, error.message);
    return null;
  }
};

// Fetch Fear and Greed Index
export const fetchFearAndGreedIndex = async () => {
  try {
    const response = await alternativeApi.get('/fng/');
    return response.data.data[0];
  } catch (error) {
    console.warn('Failed to fetch Fear and Greed Index:', error.message);
    return null;
  }
};

// Fetch Long/Short Ratio (Binance API)
export const fetchLongShortRatio = async (symbol = 'BTC') => {
  try {
    // Binance uses BTCUSDT format
    const binanceSymbol = `${symbol.toUpperCase()}USDT`;
    const response = await binanceApi.get('/topLongShortAccountRatio', {
      params: {
        symbol: binanceSymbol,
        period: '5m'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const latest = response.data[0];
      return {
        longShortRatio: parseFloat(latest.longShortRatio),
        longAccount: parseFloat(latest.longAccount) * 100,
        shortAccount: parseFloat(latest.shortAccount) * 100,
        symbol: symbol
      };
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch Long/Short Ratio:', error.message);
    return null;
  }
};

// Fetch Global DeFi TVL
export const fetchGlobalDeFiTVL = async () => {
  try {
    // DefiLlama historical charts
    const response = await llamaApi.get('/v2/historicalChainTvl');
    // Response is array of { date, tvl }
    const data = response.data;
    if (data && data.length > 0) {
      const latest = data[data.length - 1];
      const prev = data[data.length - 2]; // 24h ago (approx, data is daily)
      
      const change = prev ? ((latest.tvl - prev.tvl) / prev.tvl) * 100 : 0;
      
      return {
        tvl: latest.tvl,
        change_24h: change
      };
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch Global DeFi TVL:', error.message);
    return null;
  }
};

// Fetch On-chain Analytics (Mock)
export const fetchOnChainAnalytics = async (coinId) => {
  // Mock data for now
  return {
    active_addresses_history: Array.from({ length: 90 }, (_, i) => ({ time: Date.now() - (89 - i) * 86400000, value: Math.floor(Math.random() * 100000) + 50000 })),
    whale_holdings_percent: 42.5,
    new_addresses_24h: 12500,
    tx_count_history: Array.from({ length: 90 }, (_, i) => ({ time: Date.now() - (89 - i) * 86400000, value: Math.floor(Math.random() * 500000) + 200000 })),
    large_tx_count_24h: 150,
    avg_tx_value_24h: 25000
  };
};

// Fetch Influence Metrics (Mock)
export const fetchInfluenceMetrics = async (coinId) => {
  // Mock data for now
  return {
    github_commits_history: Array.from({ length: 90 }, (_, i) => ({ time: Date.now() - (89 - i) * 86400000, value: Math.floor(Math.random() * 20) })),
    contributors_30d: 45,
    stars: 12500,
    social_volume_history: Array.from({ length: 30 }, (_, i) => ({ time: Date.now() - (29 - i) * 86400000, value: Math.floor(Math.random() * 5000) + 1000 })),
    social_sentiment_positive_percent: 75,
    social_dominance_percent: 0.8
  };
};