import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Simple mapping for top coins to sectors (using Symbols now)
export const COIN_CATEGORIES = {
  btc: "Layer 1",
  eth: "Layer 1",
  usdt: "Stablecoin",
  bnb: "Layer 1",
  sol: "Layer 1",
  usdc: "Stablecoin",
  xrp: "Layer 1",
  steth: "Liquid Staking",
  doge: "Memecoin",
  ton: "Layer 1",
  ada: "Layer 1",
  shib: "Memecoin",
  avax: "Layer 1",
  trx: "Layer 1",
  wbtc: "Wrapped",
  dot: "Layer 1",
  bch: "Layer 1",
  link: "Infrastructure",
  near: "Layer 1",
  matic: "Layer 2",
  ltc: "Layer 1",
  dai: "Stablecoin",
  uni: "DeFi",
  icp: "Layer 1",
  leo: "Exchange",
  etc: "Layer 1",
  apt: "Layer 1",
  rndr: "AI",
  fet: "AI",
  pepe: "Memecoin",
  arb: "Layer 2",
  op: "Layer 2",
  mkr: "DeFi",
  aave: "DeFi",
  ldo: "Liquid Staking",
  grt: "Infrastructure",
  atom: "Layer 1",
  fil: "Infrastructure",
  imx: "Gaming",
  vet: "Layer 1",
  hbar: "Layer 1",
  ftm: "Layer 1",
  theta: "Infrastructure",
  rune: "DeFi",
  ar: "Infrastructure",
  mana: "Gaming",
  sand: "Gaming",
  axs: "Gaming",
  gala: "Gaming",
  ape: "Gaming",
  chz: "Gaming",
  crv: "DeFi",
  snx: "DeFi",
  cake: "DeFi",
  "1inch": "DeFi",
  comp: "DeFi",
  dydx: "DeFi",
  sushi: "DeFi",
  yfi: "DeFi",
  inj: "DeFi",
  agix: "AI",
  ocean: "AI",
  akt: "AI",
  wld: "AI",
  tao: "AI",
  bonk: "Memecoin",
  wif: "Memecoin",
  floki: "Memecoin",
};

// Ecosystem Mapping (Symbol -> Ecosystem Name)
export const ECOSYSTEM_MAPPING = {
  ethereum: ['eth', 'steth', 'uni', 'link', 'aave', 'mkr', 'ldo', 'grt', 'shib', 'pepe', 'rndr', 'fet', 'imx', 'mana', 'sand', 'axs', 'gala', 'ape', 'chz', 'crv', 'snx', '1inch', 'comp', 'dydx', 'sushi', 'yfi', 'agix', 'ocean', 'wld'],
  solana: ['sol', 'bonk', 'wif', 'rndr', 'pyth', 'jup', 'jto'],
  'bnb chain': ['bnb', 'cake', 'floki', 'twt', 'xvs'],
};

// DefiLlama Slug Mapping (Symbol -> Slug)
export const DEFILLAMA_MAPPING = {
  // Protocols
  uni: 'uniswap',
  aave: 'aave',
  mkr: 'makerdao',
  ldo: 'lido',
  crv: 'curve-dex',
  snx: 'synthetix',
  cake: 'pancakeswap',
  '1inch': '1inch-network',
  comp: 'compound-finance',
  dydx: 'dydx',
  sushi: 'sushiswap',
  yfi: 'yearn-finance',
  inj: 'injective',
  rune: 'thorchain',
  gmx: 'gmx',
  pendle: 'gmx', // Placeholder
  jup: 'jupiter-aggregator',
  
  // Chains (for TVL)
  eth: 'ethereum',
  sol: 'solana',
  arb: 'arbitrum',
  op: 'optimism',
  matic: 'polygon',
  bnb: 'bsc',
  avax: 'avalanche',
  trx: 'tron',
};

export const getCoinCategory = (coinSymbol) => {
  return COIN_CATEGORIES[coinSymbol?.toLowerCase()] || "Others";
};

export const getCoinEcosystems = (coinSymbol) => {
  const symbol = coinSymbol?.toLowerCase();
  const ecosystems = [];
  for (const [eco, coins] of Object.entries(ECOSYSTEM_MAPPING)) {
    if (coins.includes(symbol)) {
      ecosystems.push(eco);
    }
  }
  return ecosystems;
};

export const getDefiLlamaSlug = (coinSymbol) => {
  return DEFILLAMA_MAPPING[coinSymbol?.toLowerCase()];
};
export const generateSparklinePath = (data, width, height) => {
  if (!data || data.length === 0) return '';

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  // Avoid division by zero if flat line
  const scaleY = range === 0 ? 0 : height / range;
  const stepX = width / (data.length - 1);

  return data.map((val, i) => {
    const x = i * stepX;
    const y = height - (val - min) * scaleY;
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');
};