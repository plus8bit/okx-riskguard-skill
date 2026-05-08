import type { SupportedChain, TokenPairSnapshot } from "@/src/types/risk";

const DEXSCREENER_BASE_URL = "https://api.dexscreener.com";

export async function fetchTokenPairs(chainId: SupportedChain, tokenAddress: string) {
  const normalized = tokenAddress.trim();
  const url = `${DEXSCREENER_BASE_URL}/token-pairs/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(normalized)}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    },
    next: {
      revalidate: 20
    }
  });

  if (!response.ok) {
    throw new Error(`DexScreener request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as TokenPairSnapshot[];
  return payload.filter((pair) => pair?.pairAddress && pair?.baseToken?.address);
}

export function selectPrimaryPair(pairs: TokenPairSnapshot[]) {
  return [...pairs].sort((a, b) => {
    const aLiquidity = a.liquidity?.usd ?? 0;
    const bLiquidity = b.liquidity?.usd ?? 0;
    const aVolume = a.volume?.h24 ?? 0;
    const bVolume = b.volume?.h24 ?? 0;
    return bLiquidity + bVolume * 0.25 - (aLiquidity + aVolume * 0.25);
  })[0];
}
