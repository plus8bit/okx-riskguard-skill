"use client";

import { useMemo, useState } from "react";
import type { RiskReport, SupportedChain } from "@/src/types/risk";

type AnalyzerState =
  | { status: "idle"; report?: never; error?: never }
  | { status: "loading"; report?: never; error?: never }
  | { status: "ready"; report: RiskReport; error?: never }
  | { status: "error"; error: string; report?: never };

const chains: SupportedChain[] = ["solana", "base", "ethereum", "bsc", "arbitrum", "polygon"];

function verdictClass(verdict?: string) {
  if (verdict === "pass") return "border-emerald-300/40 text-emerald-200";
  if (verdict === "caution") return "border-yellow-300/40 text-yellow-200";
  if (verdict === "block") return "border-rose-300/40 text-rose-200";
  return "border-slate-500/40 text-slate-200";
}

export function RiskguardConsole() {
  const [chainId, setChainId] = useState<SupportedChain>("solana");
  const [tokenAddress, setTokenAddress] = useState("So11111111111111111111111111111111111111112");
  const [walletUsd, setWalletUsd] = useState("1500");
  const [intendedBuyUsd, setIntendedBuyUsd] = useState("100");
  const [maxRiskPct, setMaxRiskPct] = useState("1.5");
  const [state, setState] = useState<AnalyzerState>({ status: "idle" });

  const terminalLines = useMemo(() => {
    if (state.status === "idle") {
      return [
        "[idle] Waiting for token address.",
        "[policy] Skill blocks execution until risk report is generated.",
        "[integration] OKX OnchainOS tools are called after PASS/CAUTION only."
      ];
    }

    if (state.status === "loading") {
      return [
        "[fetch] Requesting token pair data.",
        "[score] Evaluating liquidity, volume, volatility, flow balance.",
        "[policy] Building agent instruction for okx-dex-swap."
      ];
    }

    if (state.status === "error") {
      return [`[error] ${state.error}`];
    }

    return [
      `[risk] verdict=${state.report.verdict} score=${state.report.score}`,
      `[token] ${state.report.token.symbol} on ${state.report.token.chainId}`,
      `[liquidity] $${state.report.metrics.liquidityUsd.toLocaleString()} on ${state.report.metrics.dexId}`,
      `[position] recommended=$${state.report.recommendedPositionUsd.toLocaleString()} max=$${state.report.maxPositionUsd.toLocaleString()}`,
      `[agent] ${state.report.agentInstruction}`
    ];
  }, [state]);

  async function analyze(useSample = false) {
    setState({ status: "loading" });
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        chainId,
        tokenAddress,
        walletUsd,
        intendedBuyUsd,
        maxRiskPct,
        useSample
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setState({ status: "error", error: payload.error ?? "Risk analysis failed" });
      return;
    }

    setState({ status: "ready", report: payload as RiskReport });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8">
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200/80">OKX OnchainOS Skill</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">Onchain RiskGuard</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Protective strategy skill for Agentic Wallet. It evaluates token liquidity, volume, volatility, trade flow,
            position size, and exit plan before an agent is allowed to call swap execution.
          </p>
        </div>
        <div className="glass rounded-2xl px-5 py-4 text-sm text-slate-300">
          <div className="font-semibold text-white">Target track</div>
          <div>Top Skill rewards · 500 USDC per winner</div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="glass rounded-3xl p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Skill Inputs</h2>
            <span className="rounded-full border border-emerald-300/30 px-3 py-1 text-xs text-emerald-200">pre-trade policy</span>
          </div>

          <label className="block text-sm text-slate-300">
            Chain
            <select
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-300"
              value={chainId}
              onChange={(event) => setChainId(event.target.value as SupportedChain)}
            >
              {chains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block text-sm text-slate-300">
            Token address
            <input
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-300"
              value={tokenAddress}
              onChange={(event) => setTokenAddress(event.target.value)}
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm text-slate-300">
              Wallet USD
              <input
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-300"
                value={walletUsd}
                onChange={(event) => setWalletUsd(event.target.value)}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Buy USD
              <input
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-300"
                value={intendedBuyUsd}
                onChange={(event) => setIntendedBuyUsd(event.target.value)}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Risk %
              <input
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-300"
                value={maxRiskPct}
                onChange={(event) => setMaxRiskPct(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              className="rounded-2xl bg-emerald-300 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-200 disabled:opacity-60"
              disabled={state.status === "loading"}
              onClick={() => analyze(false)}
            >
              Analyze Token
            </button>
            <button
              className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 transition hover:border-slate-500"
              disabled={state.status === "loading"}
              onClick={() => analyze(true)}
            >
              Load Safe Sample
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Agent Terminal</h2>
            <span className={`rounded-full border px-3 py-1 text-xs ${verdictClass(state.status === "ready" ? state.report.verdict : undefined)}`}>
              {state.status === "ready" ? state.report.verdict.toUpperCase() : state.status.toUpperCase()}
            </span>
          </div>
          <div className="min-h-72 rounded-2xl border border-slate-800 bg-black/60 p-4 font-mono text-sm leading-7 text-slate-300">
            {terminalLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>
      </section>

      {state.status === "ready" ? (
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="glass rounded-3xl p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">Risk Score</div>
            <div className="mt-4 text-6xl font-semibold text-white">{state.report.score}</div>
            <div className="mt-3 text-slate-300">Allowed: {state.report.allowed ? "yes" : "no"}</div>
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">Position Sizing</div>
            <div className="mt-4 text-4xl font-semibold text-white">${state.report.recommendedPositionUsd.toLocaleString()}</div>
            <div className="mt-3 text-slate-300">Slippage cap: {state.report.slippageCapPct}%</div>
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">Exit Plan</div>
            <div className="mt-4 text-2xl font-semibold text-white">SL {state.report.exitPlan.stopLossPct}% · TP {state.report.exitPlan.takeProfitPct}%</div>
            <div className="mt-3 text-slate-300">{state.report.exitPlan.dcaOut.length} DCA-out steps</div>
          </div>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <section className="glass rounded-3xl p-5">
          <h2 className="text-lg font-semibold text-white">Risk Flags</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {state.report.flags.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-4 ${verdictClass(item.severity)}`}>
                <div className="font-semibold text-white">{item.label}</div>
                <div className="mt-2 text-sm text-slate-300">{item.evidence}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
