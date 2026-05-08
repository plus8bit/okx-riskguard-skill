export type SupportedChain = "solana" | "base" | "ethereum" | "bsc" | "arbitrum" | "polygon";

export type RiskLevel = "pass" | "caution" | "block";

export type RiskInput = {
  chainId: SupportedChain;
  tokenAddress: string;
  walletUsd?: number;
  intendedBuyUsd?: number;
  maxRiskPct?: number;
};

export type TokenPairSnapshot = {
  chainId: string;
  dexId: string;
  url?: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string | null;
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  } | null;
  volume?: Record<string, number>;
  priceChange?: Record<string, number> | null;
  txns?: Record<string, { buys: number; sells: number }>;
  fdv?: number | null;
  marketCap?: number | null;
  pairCreatedAt?: number | null;
};

export type RiskFlag = {
  id: string;
  severity: RiskLevel;
  label: string;
  evidence: string;
};

export type ExitPlan = {
  stopLossPct: number;
  takeProfitPct: number;
  dcaOut: Array<{
    triggerPct: number;
    sellPct: number;
  }>;
};

export type RiskReport = {
  token: {
    chainId: string;
    address: string;
    symbol: string;
    name: string;
    priceUsd: number | null;
  };
  metrics: {
    bestPair: string;
    dexId: string;
    liquidityUsd: number;
    volume24hUsd: number;
    priceChange1hPct: number;
    priceChange24hPct: number;
    buySellImbalance24h: number;
    marketCapUsd: number | null;
    pairAgeHours: number | null;
  };
  score: number;
  verdict: RiskLevel;
  allowed: boolean;
  recommendedPositionUsd: number;
  maxPositionUsd: number;
  slippageCapPct: number;
  flags: RiskFlag[];
  exitPlan: ExitPlan;
  agentInstruction: string;
  dataSources: string[];
  generatedAt: string;
};
