import { buildRiskReport } from "./risk-engine";
import { samplePair } from "./sample-data";

const report = buildRiskReport(
  {
    chainId: "solana",
    tokenAddress: samplePair.baseToken.address,
    walletUsd: 1500,
    intendedBuyUsd: 100,
    maxRiskPct: 1.5
  },
  samplePair
);

console.log(JSON.stringify(report, null, 2));
