import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';

// Top assets to track (CoinCap IDs)
// Note: CoinCap IDs might differ from CoinGecko.
// Verified: bitcoin, ethereum, solana, binance-coin, xrp, cardano, avalanche, dogecoin
const TRACKED_ASSETS = [
  'bitcoin', 'ethereum', 'solana', 'binance-coin', 'xrp',
  'cardano', 'avalanche', 'dogecoin', 'polkadot', 'tron',
  'chainlink', 'polygon', 'shiba-inu', 'litecoin', 'bitcoin-cash',
  'uniswap', 'stellar', 'cosmos', 'near-protocol', 'internet-computer'
].join(',');

// Mapping from CoinCap ID to Symbol (lowercase)
const COINCAP_TO_SYMBOL = {
  'bitcoin': 'btc',
  'ethereum': 'eth',
  'solana': 'sol',
  'binance-coin': 'bnb',
  'xrp': 'xrp',
  'cardano': 'ada',
  'avalanche': 'avax',
  'dogecoin': 'doge',
  'polkadot': 'dot',
  'tron': 'trx',
  'chainlink': 'link',
  'polygon': 'matic',
  'shiba-inu': 'shib',
  'litecoin': 'ltc',
  'bitcoin-cash': 'bch',
  'uniswap': 'uni',
  'stellar': 'xlm',
  'cosmos': 'atom',
  'near-protocol': 'near',
  'internet-computer': 'icp'
};

export const useRealTimeData = () => {
  const queryClient = useQueryClient();
  const { setStreamConnected } = useAppStore();
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    // Close existing connection if any (e.g. closing or closed)
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Use CoinCap WebSocket API
    const ws = new WebSocket(`wss://ws.coincap.io/prices?assets=${TRACKED_ASSETS}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Pulse Engine] Connected to CoinCap Stream');
      setIsConnected(true);
      setStreamConnected(true);
      retryCountRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const updates = JSON.parse(event.data);
        // CoinCap format: { "bitcoin": "63890.43", "ethereum": "3450.12" }
        
        if (updates && typeof updates === 'object') {
          // console.log('[Pulse Engine] Received updates:', Object.keys(updates).length); // Debug log

          // Update Market Data Cache
          queryClient.setQueryData(['marketData', 'USD', 100, null], (oldData) => {
            if (!oldData) return oldData;
            
            return oldData.map(coin => {
              // Find update for this coin
              // 1. Try direct symbol match via mapping
              let updatePriceStr = null;
              
              // Iterate updates to find match
              for (const [key, priceStr] of Object.entries(updates)) {
                const mappedSymbol = COINCAP_TO_SYMBOL[key];
                if (mappedSymbol === coin.symbol.toLowerCase()) {
                  updatePriceStr = priceStr;
                  break;
                }
                // Fallback: Name match
                if (coin.name.toLowerCase() === key || coin.name.toLowerCase().replace(' ', '-') === key) {
                   updatePriceStr = priceStr;
                   break;
                }
              }

              if (updatePriceStr) {
                 const newPrice = parseFloat(updatePriceStr);
                 // console.log(`[Pulse Engine] Updating ${coin.symbol}: ${coin.current_price} -> ${newPrice}`);
                 
                 return {
                   ...coin,
                   current_price: newPrice,
                 };
              }
              return coin;
            });
          });
        }
      } catch (error) {
        console.error('[Pulse Engine] Error processing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[Pulse Engine] Disconnected');
      setIsConnected(false);
      setStreamConnected(false);
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error('[Pulse Engine] Connection Error', error);
      ws.close();
    };

  }, [queryClient, setStreamConnected]);

  const scheduleReconnect = () => {
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000); // Exponential backoff max 30s
    console.log(`[Pulse Engine] Reconnecting in ${delay}ms...`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      retryCountRef.current++;
      connect();
    }, delay);
  };

  useEffect(() => {
    // Debounce connection to handle Strict Mode double-mount
    const timer = setTimeout(() => {
      connect();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { isConnected };
};