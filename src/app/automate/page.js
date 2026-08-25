"use client";

import { useState } from "react";
import Link from "next/link";
import { useFriction } from "@/context/FrictionContext";
import { getPriorityBadge, getAutomationBadgeClass } from "@/lib/constants";
import { createOpportunitySlug } from "@/app/guide/page";
import StarterCodeModal from "@/components/StarterCodeModal";

export default function AutomatePage() {
  const { workflow, result } = useFriction();
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
            ⚡
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900">
              No automation opportunities available yet.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
              Analyze a workflow first to discover targeted automation recommendations, generate runnable starter code, and view implementation blueprints.
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

  const topOpp = analysis.automation_opportunities?.[0] || {
    task: analysis.top_recommendation?.title || "Target Automation",
    suggestion: analysis.top_recommendation?.reason || "",
    benefit: analysis.top_recommendation?.expected_impact || "",
    tools: ["FastAPI", "Python", "Webhooks"],
    priority: "Now",
  };
  const topSlug = createOpportunitySlug(topOpp.task, 0);

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 md:px-10 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-300">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md">
              <span>⚡</span>
              <span>AUTOMATION ENGINE</span>
            </span>
            <span className="text-xs font-mono text-neutral-400">
              {analysis.automation_opportunities?.length || 0} OPPORTUNITIES DISCOVERED
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111]">
            What You Can Automate
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Prioritized by implementation speed, ROI recovery, and technical feasibility.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/simulation"
            className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔮 Simulate What-If</span>
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

      {/* ── 1. Visual Hero: TOP RECOMMENDATION ────────────────────────── */}
      {analysis.top_recommendation && (
        <section className="bg-[#111111] text-white rounded-3xl p-7 md:p-10 border-2 border-neutral-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-mono uppercase tracking-widest font-bold bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full">
              <span>⚡</span>
              <span>TOP RECOMMENDATION — IMMEDIATE ACTION</span>
            </div>

            <span className="text-xs font-mono text-neutral-400">
              POTENTIAL: {analysis.automation_potential?.toUpperCase() || "HIGH"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mt-2">
            {analysis.top_recommendation.title}
          </h2>

          <div className="grid md:grid-cols-12 gap-6 mt-6 pt-6 border-t border-neutral-800">
            <div className="md:col-span-7">
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                Why This Should Be Done First
              </p>
              <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
                {analysis.top_recommendation.reason}
              </p>
            </div>

            <div className="md:col-span-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-orange-400 mb-1.5">
                  Expected Operational Impact
                </p>
                <p className="text-neutral-100 font-semibold text-sm md:text-base leading-snug">
                  {analysis.top_recommendation.expected_impact}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenStarterModal(topOpp, 0)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>⚡ Starter Code</span>
                  <span>→</span>
                </button>

                <Link
                  href={`/guide?opportunity=${topSlug}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 border border-neutral-700"
                >
                  <span>Guide Blueprint</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Automation Opportunities Grid ─────────────────────────── */}
      <section className="bg-white border border-neutral-300 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
              OPPORTUNITIES MATRIX
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[#111] mt-1">
              Prioritized Automation Actions
            </h2>
          </div>
          <p className="text-xs font-mono text-neutral-500">
            Click to generate code or view execution steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {analysis.automation_opportunities?.map((opportunity, index) => {
            const badgeInfo = getPriorityBadge(opportunity.priority);
            const slug = createOpportunitySlug(opportunity.task, index);

            return (
              <div
                key={index}
                className={`rounded-2xl p-5 flex flex-col justify-between ${badgeInfo.card} transition`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeInfo.pill}`}>
                      {badgeInfo.tag}
                    </span>

                    <span className="text-xs font-mono text-neutral-400 font-medium">
                      #{index + 1}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-neutral-900 leading-snug">
                    {opportunity.task}
                  </h3>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      {opportunity.suggestion}
                    </p>

                    {opportunity.benefit && (
                      <div className="mt-3 p-2.5 rounded-lg bg-neutral-100 border border-neutral-200">
                        <p className="text-xs text-neutral-800 font-medium">
                          <span className="font-bold text-neutral-900">Benefit:</span> {opportunity.benefit}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {/* Tool tags */}
                  {opportunity.tools?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-neutral-200">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                        Recommended Stack
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {opportunity.tools.map((tool, toolIndex) => (
                          <span
                            key={toolIndex}
                            className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-300"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action CTAs */}
                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleOpenStarterModal(opportunity, index)}
                      className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <span>⚡ Generate Starter Code</span>
                      <span>→</span>
                    </button>

                    <Link
                      href={`/guide?opportunity=${slug}`}
                      className="w-full py-2 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 border border-neutral-300 cursor-pointer"
                    >
                      <span>View Step-by-Step Guide</span>
                      <span className="text-neutral-500">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. Recommended Workflow Timeline (Blueprint) ─────────────── */}
      {analysis.recommended_workflow && (
        <section className="bg-white border border-neutral-300 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                THE BETTER WAY
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[#111] mt-1">
                Recommended Workflow Blueprint
              </h2>
            </div>
            <p className="text-xs font-mono text-neutral-500">
              Target operational architecture step-by-step
            </p>
          </div>

          <div className="space-y-4">
            {analysis.recommended_workflow.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition"
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#111] text-white font-mono text-xs flex items-center justify-center font-bold">
                    {item.step || index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
                      {item.action}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      <strong>Tool / Actor:</strong> {item.tool}
                    </p>
                  </div>
                </div>

                <span
                  className={`self-start sm:self-auto text-[11px] font-mono px-3 py-1 rounded-full border ${getAutomationBadgeClass(
                    item.automation
                  )}`}
                >
                  {item.automation}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Bottom Step Navigation Action Bar ────────────────────────── */}
      <section className="pt-4 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/diagnostics"
          className="text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition shadow-xs flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
        >
          <span>←</span>
          <span>Back to Diagnostics</span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/simulation"
            className="flex-1 sm:flex-initial text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🔮 Simulate What-If</span>
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
