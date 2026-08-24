"use client";

import { useState } from "react";
import Link from "next/link";
import { useFriction } from "@/context/FrictionContext";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import StarterCodeModal from "@/components/StarterCodeModal";

export default function SimulationPage() {
  const {
    workflow,
    result,
    currency,
    validTeamSize,
    validHourlyCost,
  } = useFriction();

  const analysis = result?.analysis;

  const [isStarterModalOpen, setIsStarterModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [selectedOpportunityIndex, setSelectedOpportunityIndex] = useState(0);

  const handleOpenStarterModal = (opp, idx = 0) => {
    setSelectedOpportunity(opp);
    setSelectedOpportunityIndex(idx);
    setIsStarterModalOpen(true);
  };

  const handleCloseStarterModal = () => {
    setIsStarterModalOpen(false);
    setSelectedOpportunity(null);
  };

  // ── Empty State ──────────────────────────────────────────────────────────
  if (!analysis) {
    return (
      <main className="flex-1 px-4 py-16 sm:px-6 md:px-10 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="bg-white border-2 border-neutral-300 rounded-3xl p-8 sm:p-12 text-center max-w-lg shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-300 flex items-center justify-center text-2xl mx-auto">
            🔮
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900">
              No workflow to simulate yet.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
              Analyze a manual workflow first to simulate the financial, time, and team impact of automation.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            <span>Go to Analyze</span>
            <span className="text-orange-400">→</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 md:px-10 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-300">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md">
              <span>🔮</span>
              <span>SCENARIO MODELING</span>
            </span>
            <span className="text-xs font-mono text-neutral-400">
              REAL-TIME WHAT-IF SIMULATOR
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111]">
            What-If Scenario Modeling
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Simulate how automation rate, run frequency, and team size impact your recovered budget.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/automate"
            className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚡ Opportunities</span>
          </Link>

          <Link
            href="/ask"
            className="px-4 py-2.5 rounded-xl bg-[#111] hover:bg-neutral-800 text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ask FRICTION</span>
            <span className="text-orange-400">→</span>
          </Link>
        </div>
      </section>

      {/* ── What-If Simulator Component ───────────────────────────────── */}
      <WhatIfSimulator
        analysis={analysis}
        workflow={workflow}
        onOpenStarterCode={handleOpenStarterModal}
        currency={currency}
        teamSize={validTeamSize}
        hourlyCost={validHourlyCost}
      />

      {/* ── Bottom Step Navigation Action Bar ────────────────────────── */}
      <section className="pt-4 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/automate"
          className="text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition shadow-xs flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
        >
          <span>←</span>
          <span>Back to Automate</span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/diagnostics"
            className="flex-1 sm:flex-initial text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📊 Diagnostics</span>
          </Link>

          <Link
            href="/ask"
            className="flex-1 sm:flex-initial text-xs font-extrabold uppercase tracking-wider bg-[#111] hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ask FRICTION</span>
            <span className="text-orange-400">→</span>
          </Link>
        </div>
      </section>

      {/* Starter Code Modal */}
      <StarterCodeModal
        isOpen={isStarterModalOpen}
        onClose={handleCloseStarterModal}
        opportunity={selectedOpportunity}
        opportunityIndex={selectedOpportunityIndex}
        workflow={workflow}
        analysis={analysis}
      />
    </main>
  );
}
