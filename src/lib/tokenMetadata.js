// Token Metadata for Chain-Pulse v4.2 (FEAT-20)

export const SECTOR_MAPPING = {
  // Solana Ecosystem (FEAT-20)
  sol: "Layer 1",
  jup: "DeFi",
  jto: "Liquid Staking",
  pyth: "Oracle",
  rndr: "DePIN",
  hnt: "DePIN",
  wif: "Meme",
  bonk: "Meme",
  ray: "DeFi",
  orca: "DeFi",
  msol: "Liquid Staking",
  mobile: "DePIN",
  wen: "Meme",
  slerf: "Meme",
  tnsr: "NFT",
  
  // Other Major Tokens (for context)
  btc: "Layer 1",
  eth: "Layer 1",
  bnb: "Layer 1",
  usdt: "Stablecoin",
  usdc: "Stablecoin",
  xrp: "Layer 1",
  ada: "Layer 1",
  avax: "Layer 1",
  doge: "Meme",
  shib: "Meme",
  link: "Oracle",
  uni: "DeFi",
  steth: "Liquid Staking",
  pepe: "Meme",
  arb: "Layer 2",
  op: "Layer 2",
  matic: "Layer 2",
  near: "Layer 1",
  apt: "Layer 1",
  imx: "Gaming",
  ldo: "Liquid Staking",
  fil: "DePIN",
  icp: "Layer 1",
  trx: "Layer 1",
  dot: "Layer 1",
  ton: "Layer 1",
  bch: "Layer 1",
  ltc: "Layer 1",
  etc: "Layer 1",
  atom: "Layer 1",
  vet: "Layer 1",
  algo: "Layer 1",
  ftm: "Layer 1",
  aave: "DeFi",
  mkr: "DeFi",
  snx: "DeFi",
  crv: "DeFi",
  sand: "Gaming",
  mana: "Gaming",
  axs: "Gaming",
  gala: "Gaming",
  ape: "Gaming",
  chz: "Gaming",
  fet: "AI",
  agix: "AI",
  wld: "AI",
  tao: "AI",
  ar: "DePIN",
  theta: "DePIN",
  grt: "AI",
  inj: "DeFi",
  rune: "DeFi",
  cake: "DeFi",
  floki: "Meme",
  fdusd: "Stablecoin",
  twt: "Others",
  xvs: "DeFi",
  bake: "DeFi",
};

// CoinGecko IDs for Ecosystem Tokens
export const ECOSYSTEM_TOKENS = {
  solana: [
    'solana', 'jupiter-exchange-solana', 'jito-governance-token', 'pyth-network', 'render-token', 'helium', 'dogwifcoin', 'bonk', 'raydium', 'orca', 
    'msol', 'helium-mobile', 'wen-4', 'slerf', 'tensor'
  ],
  ethereum: [
    'ethereum', 'staked-ether', 'uniswap', 'chainlink', 'aave', 'maker', 'lido-dao', 'pepe', 'shiba-inu', 'arbitrum', 
    'optimism', 'matic-network', 'immutable-x', 'gala', 'the-sandbox', 'decentraland', 'apecoin', 'chiliz', 'curve-dao-token', 'havven', 
    'compound-governance-token', 'dydx-chain', '1inch', 'ethereum-name-service', 'blur', 'fetch-ai', 'singularitynet', 'worldcoin', 'the-graph'
  ],
  'bnb chain': [
    'binancecoin', 'pancakeswap-token', 'floki', 'trust-wallet-token', 'venus', 'bakerytoken', 'first-digital-usd', 'alpaca-finance', 'space-id', 'edu-coin'
  ],
};

// Helper to get sector for a token
export const getTokenSector = (symbol) => {
  return SECTOR_MAPPING[symbol?.toLowerCase()] || "Others";
};

// Helper to get ecosystems for a token
export const getTokenEcosystems = (symbol) => {
  const s = symbol?.toLowerCase();
  const ecosystems = [];
  
  // This logic is a bit flawed now that ECOSYSTEM_TOKENS uses IDs, not symbols.
  // But we can't easily map symbol -> ID without a huge map.
  // For now, let's rely on the explicit lists for fetching.
  // For filtering (if needed), we might need a reverse map or just check if the token's ID is in the list.
  
  // Implicit rules (fallback)
  if (s === 'eth') ecosystems.push('ethereum');
  if (s === 'sol') ecosystems.push('solana');
  if (s === 'bnb') ecosystems.push('bnb chain');
  
  return [...new Set(ecosystems)]; // Deduplicate
};