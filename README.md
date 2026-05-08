# Onchain RiskGuard Skill

Protective trading Skill for the OKX Agentic Wallet Trading Competition.

## Live Demo & Video

- Live demo: `https://okx-riskguard-skill.vercel.app`
- Demo video: `YOUTUBE_URL_PLACEHOLDER`

Onchain RiskGuard runs before a swap/trade intent. It checks token liquidity, volume, volatility, pair age, order-flow balance, safe position size, and exit plan. If a token fails minimum safety thresholds, the Skill instructs the agent not to call swap execution.

## Why this exists

Agentic trading needs a policy layer before execution. A trading agent can fetch quotes and build transactions, but it also needs deterministic rules that prevent unsafe trades into illiquid, volatile, one-sided, or newly created token markets.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- DexScreener public REST API for the public demo
- OKX OnchainOS skills for the real Agentic Wallet workflow

## Local Setup

```bash
cd /Users/nickdanilov/Documents/Codex/2026-04-30/https-superteam-fun-https-superteam-fun/okx-riskguard-skill
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Run deterministic sample

```bash
npm run risk:sample
```

## Agentic Wallet integration

Install official OKX OnchainOS skills in the AI agent environment:

```bash
npx skills add okx/onchainos-skills
```

RiskGuard is designed to sit before these OKX tools:

- `okx-dex-token`
- `okx-security`
- `okx-dex-market`
- `okx-dex-swap`
- `okx-onchain-gateway`

The Skill returns:

- `PASS`: agent may continue to quote/simulate/swap.
- `CAUTION`: agent may continue only with reduced size and tighter slippage.
- `BLOCK`: agent must not call swap execution.

## Files for OKX submission

- `skill/onchain-riskguard/SKILL.md`
- `skill/onchain-riskguard/manifest.json`
- `ARCHITECTURE.md`
- `README.md`

Package for upload:

```bash
npm run package:skill
```

## Security

No private keys, wallet seeds, or OKX API credentials are stored in the repository. Real OnchainOS production calls should use local `.env` credentials only.
