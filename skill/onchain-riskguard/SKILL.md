---
name: onchain-riskguard
description: Protective pre-trade strategy skill for OKX Agentic Wallet. Use before swap/trade execution to evaluate token liquidity, volume, volatility, flow balance, position size, slippage cap, and exit plan. Blocks unsafe trades before okx-dex-swap is called.
---

# Onchain RiskGuard

## Live Demo & Video

- Live demo: `VERCEL_URL_PLACEHOLDER`
- Demo video: `YOUTUBE_URL_PLACEHOLDER`

## Purpose

Use this Skill before executing a token buy or swap through Agentic Wallet. The Skill returns one of three decisions:

- `PASS`: token meets safety thresholds; continue with quote, simulation, and user-confirmed execution.
- `CAUTION`: token is tradable only with reduced size and tighter slippage.
- `BLOCK`: do not execute the trade.

This Skill is designed for OKX Agentic Wallet Trading Competition skill-quality judging. It prioritizes strategy completeness, risk control, execution reliability, and user safety.

## Required Inputs

- `chain`: human-readable chain name, for example `solana`, `base`, `ethereum`, `bsc`, `arbitrum`, or `polygon`.
- `token`: token address or token symbol.
- `wallet_usd`: current estimated portfolio value in USD.
- `intended_buy_usd`: planned trade size in USD.
- `max_risk_pct`: maximum allowed portfolio risk for this trade. Default: `1.5`.

## Required OKX Skills

Before this Skill is used, install OKX OnchainOS skills:

```bash
npx skills add okx/onchainos-skills
```

This Skill composes the following OKX capabilities:

- `okx-dex-token`: token metadata, pools, liquidity, holder analysis, top traders, holder clustering.
- `okx-security`: token risk scan and transaction/security checks.
- `okx-dex-market`: price and candlestick context.
- `okx-dex-swap`: quote and swap data after RiskGuard allows execution.
- `okx-onchain-gateway`: gas estimate, transaction simulation, broadcast, and order tracking.

## Execution Pipeline

1. Parse the user's trading intent.
2. Resolve the chain and token address.
3. Fetch token metadata and pool data with `okx-dex-token`.
4. Fetch token risk/security data with `okx-security`.
5. Fetch price/candlestick context with `okx-dex-market`.
6. Compute risk score:
   - minimum liquidity;
   - 24h volume;
   - 1h and 24h volatility;
   - buy/sell imbalance;
   - pair age;
   - known security flags;
   - holder concentration if available;
   - max safe position size.
7. Return a structured decision.
8. If decision is `BLOCK`, do not call `okx-dex-swap`.
9. If decision is `PASS` or `CAUTION`, use the returned `max_position_usd`, `slippage_cap_pct`, and `exit_plan`.
10. Before broadcast, call `okx-onchain-gateway` simulation.

## Risk Policy

Start at score `100`. Subtract points for failing checks.

Hard block conditions:

- Primary liquidity below `$50,000`.
- Token security scanner returns a critical risk.
- Intended buy size is too large for liquidity depth.
- Transaction simulation fails.

Caution conditions:

- Primary liquidity below `$250,000`.
- 24h volume below `$25,000`.
- Absolute 1h price change above `25%`.
- Absolute 24h price change above `60%`.
- Fewer than `20` swaps in the last 24h.
- Buy/sell imbalance above `80%`.
- Pair age below `24` hours.
- Holder concentration is unusually high.

Verdict mapping:

- `PASS`: score >= `70` and no hard block.
- `CAUTION`: score >= `45` and no hard block.
- `BLOCK`: score < `45` or any hard block.

## Position Sizing

Calculate `risk_budget_usd`:

```text
risk_budget_usd = wallet_usd * (max_risk_pct / 100)
```

Calculate max position:

```text
max_position_usd = min(
  wallet_usd * 0.12,
  primary_pair_liquidity_usd * 0.004,
  risk_budget_usd * 8
) * volatility_multiplier
```

For `CAUTION`, use tighter execution:

- slippage cap: `0.5%`;
- max size: returned `max_position_usd`;
- require one extra confirmation in the agent response.

For `PASS`:

- slippage cap: `1%`;
- max size: returned `max_position_usd`.

For `BLOCK`:

- max size: `0`;
- do not quote or execute.

## Output Schema

Return JSON:

```json
{
  "verdict": "PASS | CAUTION | BLOCK",
  "score": 0,
  "allowed": false,
  "token": {
    "chain": "solana",
    "address": "...",
    "symbol": "..."
  },
  "max_position_usd": 0,
  "recommended_position_usd": 0,
  "slippage_cap_pct": 0,
  "flags": [
    {
      "severity": "PASS | CAUTION | BLOCK",
      "label": "Minimum liquidity check failed",
      "evidence": "Primary pair liquidity is $12,000"
    }
  ],
  "exit_plan": {
    "stop_loss_pct": 5,
    "take_profit_pct": 14,
    "dca_out": [
      {
        "trigger_pct": 8,
        "sell_pct": 50
      }
    ]
  },
  "next_okx_actions": [
    "okx-dex-swap quote",
    "okx-onchain-gateway simulate",
    "Agentic Wallet signing"
  ]
}
```

## Agent Response Rules

When the token is blocked:

- Explain the failed checks.
- Do not call swap or broadcast tools.
- Ask the user to provide a different token or lower-risk intent.

When the token is caution:

- Show the reduced size and slippage cap.
- Ask for explicit confirmation before proceeding.
- After confirmation, quote through `okx-dex-swap` and simulate through `okx-onchain-gateway`.

When the token passes:

- Show the score, size cap, slippage cap, and exit plan.
- Continue to quote and simulation only if the user confirms.

## Security Declaration

This Skill does not contain private keys, seed phrases, API keys, or wallet credentials. It does not sign transactions. Signing remains inside Agentic Wallet / OnchainOS flow.
