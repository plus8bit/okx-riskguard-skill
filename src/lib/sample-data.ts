import type { TokenPairSnapshot } from "@/src/types/risk";

export const samplePair: TokenPairSnapshot = {
  chainId: "solana",
  dexId: "raydium",
  pairAddress: "sample-riskguard-pair",
  url: "https://dexscreener.com/solana/sample-riskguard-pair",
  baseToken: {
    address: "So11111111111111111111111111111111111111112",
    name: "Wrapped SOL",
    symbol: "SOL"
  },
  quoteToken: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "USD Coin",
    symbol: "USDC"
  },
  priceUsd: "154.22",
  liquidity: {
    usd: 5_600_000,
    base: 18143,
    quote: 2_801_000
  },
  volume: {
    h24: 11_800_000,
    h6: 2_900_000,
    h1: 430_000
  },
  priceChange: {
    h24: 3.4,
    h6: -1.2,
    h1: 0.7
  },
  txns: {
    h24: {
      buys: 2844,
      sells: 2697
    }
  },
  fdv: 88_000_000_000,
  marketCap: 88_000_000_000,
  pairCreatedAt: Date.now() - 1000 * 60 * 60 * 24 * 900
};
