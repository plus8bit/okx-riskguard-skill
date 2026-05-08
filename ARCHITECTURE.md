# Onchain RiskGuard Skill Architecture

## Objective

Onchain RiskGuard is a protective strategy Skill for the OKX Agentic Wallet Trading Competition. The Skill runs before a swap/trade intent is executed. It evaluates token risk, computes a safe position size, generates an exit plan, and returns a deterministic instruction to either block the trade or continue through OKX OnchainOS execution tools.

The target reward category is Top Skill rewards. The implementation prioritizes strategy completeness, risk control, execution reliability, user safety, and clear observability.

## System Components

### 1. Agent Skill Bundle

Path: `skill/onchain-riskguard/SKILL.md`

This is the submission-facing Skill file. It describes the exact agent workflow:

1. Resolve the user intent: target chain, token address/symbol, wallet size, intended buy size.
2. Pull market and security data through OKX OnchainOS skills:
   - `okx-dex-token` for token metadata, liquidity pools, holders, top traders, and holder clustering.
   - `okx-security` for token risk and transaction pre-execution security checks.
   - `okx-dex-market` for price and candlestick context.
   - `okx-dex-swap` only after RiskGuard returns `PASS` or `CAUTION`.
   - `okx-onchain-gateway` for simulation and broadcast tracking.
3. Run the RiskGuard policy checks.
4. Return a `PASS`, `CAUTION`, or `BLOCK` verdict.

The Skill does not store private keys, API keys, wallet seed phrases, or signed transaction bytes.

### 2. Risk Engine

Path: `src/lib/risk-engine.ts`

The deterministic engine converts token/pair data into a risk report. Current checks:

- Minimum liquidity threshold.
- 24h volume threshold.
- 1h and 24h volatility thresholds.
- 24h buy/sell imbalance.
- Minimum trade count.
- Pair age check.
- Position size cap based on wallet USD value, max risk percentage, volatility, and liquidity depth.
- Exit plan generation with stop-loss, take-profit, and DCA-out schedule.

Output schema:

```ts
{
  score: number;
  verdict: "pass" | "caution" | "block";
  allowed: boolean;
  recommendedPositionUsd: number;
  maxPositionUsd: number;
  slippageCapPct: number;
  flags: RiskFlag[];
  exitPlan: ExitPlan;
  agentInstruction: string;
}
```

### 3. Market Data Connector

Path: `src/lib/dexscreener.ts`

The demo connector fetches public token-pair data from DexScreener:

```http
GET https://api.dexscreener.com/token-pairs/v1/{chainId}/{tokenAddress}
```

DexScreener is used for the public UI demo because it does not require API keys. In the Agentic Wallet execution path, the Skill instructs the agent to use OKX OnchainOS skills as the primary source of market/security data. This gives the judges a visible OnchainOS integration path while keeping the demo runnable without credentials.

### 4. Next.js Demo UI

Paths:

- `app/page.tsx`
- `components/riskguard-console.tsx`
- `app/api/analyze/route.ts`

The UI demonstrates the policy layer:

1. User enters chain, token address, wallet USD size, intended buy size, and risk percentage.
2. Browser posts data to `/api/analyze`.
3. API route fetches pair data, calls the risk engine, and returns a structured report.
4. UI renders score, verdict, risk flags, position size, slippage cap, and exit plan.

The UI is not the final trading surface. It is a judge-visible demo proving the Skill's policy logic.

## External APIs and Credentials

### Required for demo

- DexScreener public REST API.
- No API key required.

### Required for real Agentic Wallet execution

- OKX OnchainOS skills installed in the user's AI agent:

```bash
npx skills add okx/onchainos-skills
```

- OKX API credentials for production-grade OnchainOS calls:

```env
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=
```

Credentials are not committed. `.env` and `.env.local` are ignored.

## Skill Execution Pipeline

```mermaid
sequenceDiagram
  participant User
  participant Agent as AI Agent + Agentic Wallet
  participant RG as Onchain RiskGuard Skill
  participant OKX as OKX OnchainOS Skills
  participant Dex as Market Data APIs
  participant Chain as Onchain Network

  User->>Agent: "Buy token X with 100 USDC if safe"
  Agent->>RG: Resolve chain, token, wallet size, intended buy size
  RG->>OKX: okx-dex-token token metadata / holders / pools
  RG->>OKX: okx-security token risk / tx pre-execution checks
  RG->>Dex: Optional public pair data enrichment for demo
  RG->>RG: Score liquidity, volume, volatility, flow, pair age
  RG->>RG: Compute position cap and exit plan
  alt verdict BLOCK
    RG->>Agent: Return block reason; do not call swap
  else verdict PASS or CAUTION
    RG->>Agent: Return slippage cap, max size, exit plan
    Agent->>OKX: okx-dex-swap quote / execution data
    Agent->>OKX: okx-onchain-gateway simulation
    Agent->>Chain: Broadcast only after Agentic Wallet signing
  end
```

## Risk Score Policy

RiskGuard starts at 100 and subtracts points for risk signals:

- Liquidity below $50,000: hard block.
- Liquidity below $250,000: caution.
- 24h volume below $25,000: caution.
- 1h price movement above 25%: caution.
- 24h price movement above 60%: caution.
- Fewer than 20 swaps in 24h: caution.
- Buy/sell imbalance above 80%: caution.
- Pair younger than 24 hours: caution.

Verdict mapping:

- `PASS`: score >= 70 and no hard block.
- `CAUTION`: score >= 45 and no hard block.
- `BLOCK`: score < 45 or hard block.

## Position Sizing

The position cap is the minimum of:

- 12% of wallet USD value.
- 0.4% of primary-pair liquidity.
- 8x risk budget, where risk budget = `walletUsd * maxRiskPct`.

The cap is reduced by a volatility multiplier based on the 24h price change. A blocked token returns zero recommended size and zero slippage cap.

## Security Boundary

- No private keys in backend.
- No signing in backend.
- No seed phrases in UI.
- No API keys committed.
- The Skill blocks execution before swap if market/security checks fail.
- The final trade, when allowed, must be signed through Agentic Wallet / TEE-controlled flow.

## Submission Packaging

The submission package should include:

- `skill/onchain-riskguard/SKILL.md`
- `skill/onchain-riskguard/manifest.json`
- `ARCHITECTURE.md`
- `README.md`
- A public GitHub link.
- A short video showing the UI and explaining the Agentic Wallet execution path.

Run:

```bash
npm run package:skill
```

This creates a local tarball under `dist/` for upload if the OKX form asks for files instead of a GitHub link.
