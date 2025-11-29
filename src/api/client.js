import axios from 'axios';

// CryptoCompare API Base URL
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data';
const DEFILLAMA_BASE_URL = 'https://api.llama.fi';

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

// Fetch Global Market Data (Total Market Cap, Volume)
export const fetchGlobalData = async () => {
  return {}; // We will handle the aggregation in the hook
};

// Fetch Market Data (Top Coins by Market Cap)
export const fetchMarketData = async (currency = 'USD', limit = 100) => {
  const response = await api.get('/top/mktcapfull', {
    params: {
      limit: limit,
      tsym: currency,
    },
  });
  return response.data.Data;
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
export const fetchCoinMarketChart = async (coinSymbol, limit = 168) => { // 168 hours = 7 days
  const response = await api.get('/v2/histohour', {
    params: {
      fsym: coinSymbol,
      tsym: 'USD',
      limit: limit,
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
  const response = await llamaApi.get(`/tvl/${protocolSlug}`);
  return response.data;
};