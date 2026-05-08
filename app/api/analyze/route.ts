import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchTokenPairs, selectPrimaryPair } from "@/src/lib/dexscreener";
import { buildRiskReport } from "@/src/lib/risk-engine";
import { samplePair } from "@/src/lib/sample-data";

const requestSchema = z.object({
  chainId: z.enum(["solana", "base", "ethereum", "bsc", "arbitrum", "polygon"]).default("solana"),
  tokenAddress: z.string().min(20),
  walletUsd: z.coerce.number().positive().optional(),
  intendedBuyUsd: z.coerce.number().positive().optional(),
  maxRiskPct: z.coerce.number().positive().max(10).optional(),
  useSample: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = requestSchema.parse(body);
    const pair = input.useSample ? samplePair : selectPrimaryPair(await fetchTokenPairs(input.chainId, input.tokenAddress));

    if (!pair) {
      return NextResponse.json(
        {
          error: "No liquid DEX pair found for this token.",
          allowed: false
        },
        { status: 404 }
      );
    }

    const report = buildRiskReport(input, pair);
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analyzer error";
    return NextResponse.json({ error: message, allowed: false }, { status: 400 });
  }
}
