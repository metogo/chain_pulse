import axios from 'axios';

// CryptoCompare API Base URL
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data';
const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
const BLOCKCHAIR_BASE_URL = 'https://api.blockchair.com';

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

// Fetch Global Market Data (Total Market Cap, Volume)
export const fetchGlobalData = async () => {
  // This is a workaround as CryptoCompare's global data might require an API key for some endpoints.
  // We will fetch the top 100 coins and calculate the total market cap from them.
  // This is accurate enough for a "Sector Map" overview.
  return {}; // We will handle the aggregation in the hook
};

// Fetch Market Data (Top Coins by Market Cap)
export const fetchMarketData = async (currency = 'USD', limit = 100) => {
  // Using CoinGecko for better 7D change data
  try {
    throw new Error('Force fallback to CryptoCompare'); // Temporary force fallback
    console.log('[API] Fetching market data from CoinGecko...');
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: currency.toLowerCase(),
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false,
        price_change_percentage: '1h,24h,7d'
      },
    });
    console.log('[API] CoinGecko success:', response.data?.length);
    return response.data;
  } catch (error) {
    console.error('[API] CoinGecko failed:', error.message);
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