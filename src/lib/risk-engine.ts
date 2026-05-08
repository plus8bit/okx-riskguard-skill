import type { ExitPlan, RiskFlag, RiskInput, RiskLevel, RiskReport, TokenPairSnapshot } from "@/src/types/risk";

const DEFAULT_WALLET_USD = 1000;
const DEFAULT_MAX_RISK_PCT = 1.5;

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createExitPlan(score: number): ExitPlan {
  if (score >= 80) {
    return {
      stopLossPct: 8,
      takeProfitPct: 22,
      dcaOut: [
        { triggerPct: 12, sellPct: 33 },
        { triggerPct: 22, sellPct: 33 },
        { triggerPct: 35, sellPct: 34 }
      ]
    };
  }

  if (score >= 55) {
    return {
      stopLossPct: 5,
      takeProfitPct: 14,
      dcaOut: [
        { triggerPct: 8, sellPct: 50 },
        { triggerPct: 14, sellPct: 50 }
      ]
    };
  }

  return {
    stopLossPct: 3,
    takeProfitPct: 8,
    dcaOut: [{ triggerPct: 6, sellPct: 100 }]
  };
}

function verdictFromScore(score: number, hardBlock: boolean): RiskLevel {
  if (hardBlock || score < 45) return "block";
  if (score < 70) return "caution";
  return "pass";
}

function flag(id: string, severity: RiskLevel, label: string, evidence: string): RiskFlag {
  return { id, severity, label, evidence };
}

export function buildRiskReport(input: RiskInput, pair: TokenPairSnapshot): RiskReport {
  const liquidityUsd = numberOrZero(pair.liquidity?.usd);
  const volume24hUsd = numberOrZero(pair.volume?.h24);
  const priceChange1hPct = numberOrZero(pair.priceChange?.h1);
  const priceChange24hPct = numberOrZero(pair.priceChange?.h24);
  const buys24h = numberOrZero(pair.txns?.h24?.buys);
  const sells24h = numberOrZero(pair.txns?.h24?.sells);
  const marketCapUsd = pair.marketCap ?? pair.fdv ?? null;
  const pairAgeHours = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 1000 / 60 / 60 : null;
  const flags: RiskFlag[] = [];

  let score = 100;
  let hardBlock = false;

  if (liquidityUsd < 50_000) {
    score -= 35;
    hardBlock = true;
    flags.push(flag("low_liquidity", "block", "Minimum liquidity check failed", `Primary pair liquidity is $${liquidityUsd.toLocaleString()}.`));
  } else if (liquidityUsd < 250_000) {
    score -= 18;
    flags.push(flag("thin_liquidity", "caution", "Thin liquidity", `Primary pair liquidity is $${liquidityUsd.toLocaleString()}.`));
  }

  if (volume24hUsd < 25_000) {
    score -= 18;
    flags.push(flag("low_volume", "caution", "Low 24h volume", `24h volume is $${volume24hUsd.toLocaleString()}.`));
  }

  if (Math.abs(priceChange1hPct) > 25) {
    score -= 18;
    flags.push(flag("high_intraday_volatility", "caution", "High 1h volatility", `1h price change is ${priceChange1hPct.toFixed(2)}%.`));
  }

  if (Math.abs(priceChange24hPct) > 60) {
    score -= 15;
    flags.push(flag("high_daily_volatility", "caution", "High 24h volatility", `24h price change is ${priceChange24hPct.toFixed(2)}%.`));
  }

  const totalTxns24h = buys24h + sells24h;
  const buySellImbalance24h = totalTxns24h > 0 ? Math.abs(buys24h - sells24h) / totalTxns24h : 1;
  if (totalTxns24h < 20) {
    score -= 12;
    flags.push(flag("low_trade_count", "caution", "Low trade count", `Only ${totalTxns24h} swaps in the last 24h.`));
  }

  if (buySellImbalance24h > 0.8) {
    score -= 15;
    flags.push(flag("one_sided_flow", "caution", "One-sided order flow", `24h buy/sell imbalance is ${(buySellImbalance24h * 100).toFixed(1)}%.`));
  }

  if (pairAgeHours !== null && pairAgeHours < 24) {
    score -= 20;
    flags.push(flag("new_pair", "caution", "New liquidity pair", `Primary pair age is ${pairAgeHours.toFixed(1)} hours.`));
  }

  const normalizedScore = clamp(Math.round(score), 0, 100);
  const verdict = verdictFromScore(normalizedScore, hardBlock);
  const walletUsd = input.walletUsd ?? DEFAULT_WALLET_USD;
  const maxRiskPct = input.maxRiskPct ?? DEFAULT_MAX_RISK_PCT;
  const riskBudgetUsd = walletUsd * (maxRiskPct / 100);
  const volatilityMultiplier = Math.max(0.25, 1 - Math.abs(priceChange24hPct) / 100);
  const liquidityCapUsd = liquidityUsd * 0.004;
  const maxPositionUsd = verdict === "block" ? 0 : Math.max(0, Math.min(walletUsd * 0.12, liquidityCapUsd, riskBudgetUsd * 8) * volatilityMultiplier);
  const intendedBuyUsd = input.intendedBuyUsd ?? maxPositionUsd;
  const recommendedPositionUsd = verdict === "block" ? 0 : Math.min(maxPositionUsd, intendedBuyUsd);
  const exitPlan = createExitPlan(normalizedScore);

  if (flags.length === 0) {
    flags.push(flag("clean_market_snapshot", "pass", "No hard risk flags", "Liquidity, volume, volatility, and flow checks passed current thresholds."));
  }

  return {
    token: {
      chainId: pair.chainId,
      address: input.tokenAddress,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null
    },
    metrics: {
      bestPair: pair.pairAddress,
      dexId: pair.dexId,
      liquidityUsd,
      volume24hUsd,
      priceChange1hPct,
      priceChange24hPct,
      buySellImbalance24h,
      marketCapUsd,
      pairAgeHours
    },
    score: normalizedScore,
    verdict,
    allowed: verdict !== "block",
    recommendedPositionUsd: Number(recommendedPositionUsd.toFixed(2)),
    maxPositionUsd: Number(maxPositionUsd.toFixed(2)),
    slippageCapPct: verdict === "pass" ? 1 : verdict === "caution" ? 0.5 : 0,
    flags,
    exitPlan,
    agentInstruction:
      verdict === "block"
        ? "Do not call okx-dex-swap. Explain the failed checks and ask for a different token."
        : `If the user confirms, call okx-dex-swap with max trade size $${recommendedPositionUsd.toFixed(2)}, slippage cap ${verdict === "pass" ? "1%" : "0.5%"}, then call okx-onchain-gateway simulation before broadcast.`,
    dataSources: ["DexScreener token-pairs public API", "OKX OnchainOS skills: okx-dex-token, okx-security, okx-dex-swap, okx-onchain-gateway"],
    generatedAt: new Date().toISOString()
  };
}
