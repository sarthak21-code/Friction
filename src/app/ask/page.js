"use client";

import Link from "next/link";
import { useFriction } from "@/context/FrictionContext";

const PRESET_QUESTIONS = [
  "What is the fastest way to automate this workflow?",
  "Which low-code tools (Zapier, Make, n8n) work best here?",
  "What edge cases and failure modes should we watch for?",
  "How can we measure team time savings after automation?",
];

export default function AskFrictionPage() {
  const {
    workflow,
    result,
    askQuestion,
    setAskQuestion,
    askAnswer,
    askLoading,
    askError,
    copiedAsk,
    handleAskFriction,
    handleCopySolution,
  } = useFriction();

  const analysis = result?.analysis;
  const hasAnalysis = Boolean(analysis);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAskFriction();
  };

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 md:px-10 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-300">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md">
              <span>💬</span>
              <span>AI COPILOT</span>
            </span>
            <span className="text-xs font-mono text-neutral-400">
              ASK FRICTION WORKSPACE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111]">
            Ask FRICTION
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Ask anything about your workflow, friction points, or improvement opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasAnalysis ? (
            <Link
              href="/diagnostics"
              className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>📊 Diagnostics</span>
            </Link>
          ) : (
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-[#111] hover:bg-neutral-800 text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Analyze a Workflow</span>
              <span className="text-orange-400">→</span>
            </Link>
          )}
        </div>
      </section>

      {/* ── Workflow Context Card (or Advisory if none) ───────────────── */}
      {hasAnalysis ? (
        <div className="p-5 rounded-2xl bg-white border border-neutral-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full font-bold">
              ACTIVE CONTEXT: {analysis.top_recommendation?.title || "Workflow Analyzed"}
            </span>
            <p className="text-sm font-extrabold text-neutral-900 mt-1.5">
              Friction Score: <span className="text-orange-600 font-mono">{analysis.friction_score}/100</span> ({analysis.severity || "High"} Severity)
            </p>
            <p className="text-xs text-neutral-600 mt-0.5 line-clamp-1">
              {analysis.summary}
            </p>
          </div>

          <Link
            href="/automate"
            className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition border border-neutral-300 self-start sm:self-auto whitespace-nowrap"
          >
            View Automations →
          </Link>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-xs font-bold text-neutral-800">
                Analyze a workflow first to give FRICTION full context for your questions.
              </p>
              <p className="text-[11px] text-neutral-500 font-mono">
                You can still ask general questions about tools, automation architecture, or API design below.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-[#111] hover:bg-neutral-800 text-white text-xs font-mono font-bold uppercase tracking-wider transition self-start sm:self-auto whitespace-nowrap"
          >
            Go to Analyze →
          </Link>
        </div>
      )}

      {/* ── Main Query Form Box ──────────────────────────────────────── */}
      <section className="bg-white border-2 border-neutral-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Preset Prompt Suggestions */}
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold mb-2">
            Suggested Queries:
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUESTIONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskFriction(preset)}
                className="text-xs font-medium px-3.5 py-2 rounded-xl border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-500 text-neutral-800 transition text-left cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Question Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              placeholder="Ask FRICTION how to automate this, which tools to pick, or potential failure points..."
              className="flex-1 p-3.5 sm:p-4 rounded-2xl border-2 border-neutral-300 focus:border-neutral-900 focus:outline-none text-neutral-900 text-sm font-sans placeholder-neutral-400 bg-neutral-50/60 transition"
            />

            <button
              type="submit"
              disabled={askLoading || !askQuestion.trim()}
              className="px-6 py-3.5 rounded-2xl bg-[#111] hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              {askLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Consult Copilot</span>
                  <span className="text-orange-400 font-bold">→</span>
                </>
              )}
            </button>
          </div>

          {askError && (
            <p className="text-xs text-red-600 font-mono">
              ⚠️ {askError}
            </p>
          )}
        </form>

        {/* ── Copilot Answer Result Card ────────────────────────────── */}
        {askAnswer && (
          <div className="bg-[#111111] text-white rounded-2xl p-6 sm:p-8 border border-neutral-800 shadow-md space-y-5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                FRICTION RESOLUTION
              </span>
              <button
                type="button"
                onClick={handleCopySolution}
                className="text-[11px] font-mono px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer border border-neutral-700"
              >
                {copiedAsk ? "✓ Copied Solution" : "📋 Copy Solution"}
              </button>
            </div>

            {/* Direct Answer */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-100 leading-snug">
                {askAnswer.direct_answer}
              </h3>
            </div>

            {/* Action Steps */}
            {askAnswer.action_steps?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  Recommended Action Steps
                </p>
                <div className="space-y-2">
                  {askAnswer.action_steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-orange-400 font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border border-neutral-700">
                        {idx + 1}
                      </span>
                      <span className="font-medium leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Tools */}
            {askAnswer.recommended_tools?.length > 0 && (
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold mb-2">
                  Recommended Technology Stack
                </p>
                <div className="flex flex-wrap gap-2">
                  {askAnswer.recommended_tools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-neutral-800 text-orange-300 border border-neutral-700"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pro Tip */}
            {askAnswer.pro_tip && (
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-200">
                <p className="font-mono uppercase font-bold text-[10px] text-orange-400 mb-1">
                  💡 PRO TIP
                </p>
                <p className="leading-relaxed">
                  {askAnswer.pro_tip}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Bottom Step Navigation Action Bar ────────────────────────── */}
      <section className="pt-4 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/automate"
          className="text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition shadow-xs flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
        >
          <span>←</span>
          <span>Back to Automations</span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/simulation"
            className="flex-1 sm:flex-initial text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🔮 Simulation</span>
          </Link>

          <Link
            href="/diagnostics"
            className="flex-1 sm:flex-initial text-xs font-extrabold uppercase tracking-wider bg-[#111] hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Diagnostics</span>
            <span className="text-orange-400">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
