"use client";

import { useState } from "react";
import Link from "next/link";
import { useFriction } from "@/context/FrictionContext";
import { CURRENCIES, getSeverityBadgeClass } from "@/lib/constants";
import ExecutiveReportModal from "@/components/ExecutiveReportModal";

export default function DiagnosticsPage() {
  const {
    workflow,
    result,
    handleReset,
    teamSize,
    setTeamSize,
    timeWastedMinutes,
    setTimeWastedMinutes,
    hourlyCost,
    setHourlyCost,
    daysPerWeek,
    setDaysPerWeek,
    weeksPerYear,
    setWeeksPerYear,
    currency,
    setCurrency,
    recoveryRate,
    setRecoveryRate,
    validTeamSize,
    validTimeWasted,
    validHourlyCost,
    validDaysPerWeek,
    validWeeksPerYear,
    validRecoveryRate,
    dailyHoursWasted,
    weeklyHoursWasted,
    annualHoursWasted,
    annualCost,
    monthlyCost,
    potentialRecoverableCost,
    remainingInefficiencyCost,
    recoverableHours,
    formatCurrencyValue,
  } = useFriction();

  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);

  const analysis = result?.analysis;

  // ── Empty State ──────────────────────────────────────────────────────────
  if (!analysis) {
    return (
      <main className="flex-1 px-4 py-16 sm:px-6 md:px-10 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="bg-white border-2 border-neutral-300 rounded-3xl p-8 sm:p-12 text-center max-w-lg shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-300 flex items-center justify-center text-2xl mx-auto">
            📊
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900">
              No workflow analyzed yet.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
              Analyze a manual workflow or upload a diagram to see your friction score, time waste calculation, and financial diagnosis.
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

  const confidence = analysis?.estimated_time_wasted?.confidence;
  const hasAiTimeEstimate = Boolean(analysis?.estimated_time_wasted?.value);

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 md:px-10 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
      {/* ── Top Header & Report Actions ────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-300">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md">
              <span>📊</span>
              <span>WORKFLOW DIAGNOSTICS</span>
            </span>
            <span className="text-xs font-mono text-neutral-400">
              AUDIT RESULT
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111]">
            Your workflow has{" "}
            <span className="text-orange-600 underline decoration-orange-500 decoration-3 underline-offset-4">
              {analysis.severity || "Significant"}
            </span>{" "}
            friction.
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsExecutiveReportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>📄</span>
            <span>Executive PDF Report</span>
          </button>

          <Link
            href="/automate"
            className="px-4 py-2.5 rounded-xl bg-[#111] hover:bg-neutral-800 text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Explore Automations</span>
            <span className="text-orange-400">→</span>
          </Link>
        </div>
      </section>

      {/* ── 1. Primary Diagnostic Metrics Grid ────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Card 1: Friction Score */}
        <div className="bg-[#111] text-white rounded-2xl p-6 md:p-7 flex flex-col justify-between shadow-md border border-neutral-800 relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                DIAGNOSTIC SCORE
              </p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono uppercase rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                {analysis.severity || "Evaluated"}
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tight text-white">
                {analysis.friction_score ?? "—"}
              </span>
              <span className="text-neutral-500 text-lg font-mono">/ 100</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-800">
            <p className="text-xs font-mono text-neutral-400 mb-1">
              Score Interpretation
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed font-medium">
              {analysis.score_explanation || "Higher score indicates heavier manual drag and handoff latency."}
            </p>
          </div>
        </div>

        {/* Card 2: Estimated Time Wasted */}
        <div className="bg-white border border-neutral-300 rounded-2xl p-6 md:p-7 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                ESTIMATED TIME WASTED
              </p>
              {confidence && (
                <span className="text-xs font-mono text-neutral-500 uppercase">
                  {confidence} CONFIDENCE
                </span>
              )}
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tight text-neutral-900">
                {validTimeWasted}
              </span>
              <span className="text-neutral-600 text-sm font-mono">
                min / day / person
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Annualized Burden
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed font-medium">
              ~{annualHoursWasted} hours lost per year across {validTeamSize} team member(s).
            </p>
          </div>
        </div>

        {/* Card 3: Automation Potential */}
        <div className="bg-white border border-neutral-300 rounded-2xl p-6 md:p-7 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                AUTOMATION POTENTIAL
              </p>
              <span className="text-xs font-mono text-emerald-700 font-bold">⚡ VIABILITY</span>
            </div>

            <div className="mt-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-2xl tracking-tight">
                <span>✓</span>
                <span>{analysis.automation_potential || "High"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Primary Summary
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed font-medium line-clamp-3">
              {analysis.summary}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Enterprise Value & ROI Calculator ──────────────────────── */}
      <section
        id="roi-calculator"
        className="bg-white border-2 border-neutral-300 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md">
                <span>💰</span>
                <span>ENTERPRISE VALUE &amp; ROI</span>
              </span>
              <span className="text-xs font-mono text-neutral-400">
                FINANCIAL INEFFICIENCY DIAGNOSTIC
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111]">
              Cost of Workflow Inefficiency
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Translate manual operational latency into estimated annual financial overhead.
            </p>
          </div>

          {/* Currency Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-300 self-start md:self-auto">
            <span className="text-[11px] font-mono text-neutral-500 px-2 uppercase font-semibold">
              Currency:
            </span>
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                  currency === c.code
                    ? "bg-[#111] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Grid */}
        <div className="mt-8 grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Inputs */}
          <div className="lg:col-span-5 space-y-5 bg-neutral-50 p-5 sm:p-6 rounded-2xl border border-neutral-200 flex flex-col justify-between">
            <div className="space-y-4">
              {/* 1. Team Size */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="team-size-input" className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Team Members Performing Workflow
                  </label>
                  <span className="text-xs font-mono font-bold text-neutral-700">
                    {validTeamSize} {validTeamSize === 1 ? "person" : "people"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTeamSize(Math.max(1, validTeamSize - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-700 font-bold text-lg flex items-center justify-center transition cursor-pointer"
                    aria-label="Decrease team size"
                  >
                    -
                  </button>
                  <input
                    id="team-size-input"
                    type="number"
                    min="1"
                    max="500"
                    value={teamSize}
                    onChange={(e) => setTeamSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="flex-1 text-center font-mono font-bold text-base bg-white border border-neutral-300 rounded-xl py-2 px-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setTeamSize(validTeamSize + 1)}
                    className="w-10 h-10 rounded-xl bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-700 font-bold text-lg flex items-center justify-center transition cursor-pointer"
                    aria-label="Increase team size"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2. Time Wasted */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="time-wasted-input" className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Time Wasted (Min/Day/Person)
                  </label>
                  <span className="text-xs font-mono font-bold text-orange-600">
                    ~{validTimeWasted} min/day
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="time-wasted-input"
                    type="number"
                    min="0"
                    max="480"
                    step="5"
                    value={timeWastedMinutes}
                    onChange={(e) => setTimeWastedMinutes(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="flex-1 font-mono font-bold text-base bg-white border border-neutral-300 rounded-xl py-2 px-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-xs font-mono text-neutral-500 font-medium px-2">
                    minutes
                  </span>
                </div>
                {/* Quick Chips */}
                <div className="flex gap-1.5 mt-2">
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimeWastedMinutes(mins)}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        validTimeWasted === mins
                          ? "bg-neutral-900 text-white border-neutral-900 font-bold"
                          : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Hourly Cost */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="hourly-cost-input" className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Fully Loaded Hourly Wage ({CURRENCIES.find((c) => c.code === currency)?.symbol || "₹"})
                  </label>
                  <span className="text-xs font-mono font-bold text-neutral-700">
                    {formatCurrencyValue(validHourlyCost)}/hr
                  </span>
                </div>
                <input
                  id="hourly-cost-input"
                  type="number"
                  min="0"
                  step="50"
                  value={hourlyCost}
                  onChange={(e) => setHourlyCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full font-mono font-bold text-base bg-white border border-neutral-300 rounded-xl py-2 px-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 4. Cadence: Days/Week & Weeks/Year */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="days-per-week-input" className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                    Days / Week
                  </label>
                  <input
                    id="days-per-week-input"
                    type="number"
                    min="1"
                    max="7"
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(Math.min(7, Math.max(1, parseInt(e.target.value, 10) || 5)))}
                    className="w-full font-mono font-bold text-sm bg-white border border-neutral-300 rounded-xl py-2 px-3 text-neutral-900 text-center"
                  />
                </div>
                <div>
                  <label htmlFor="weeks-per-year-input" className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                    Weeks / Year
                  </label>
                  <input
                    id="weeks-per-year-input"
                    type="number"
                    min="1"
                    max="52"
                    value={weeksPerYear}
                    onChange={(e) => setWeeksPerYear(Math.min(52, Math.max(1, parseInt(e.target.value, 10) || 48)))}
                    className="w-full font-mono font-bold text-sm bg-white border border-neutral-300 rounded-xl py-2 px-3 text-neutral-900 text-center"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] font-mono text-neutral-400 border-t border-neutral-200 pt-3 mt-2">
              Formula: (Team × Min / 60) × Days × Weeks × Hourly Rate
            </p>
          </div>

          {/* Right Column: Calculated Results */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            {/* Primary Result Hero */}
            <div className="bg-[#111111] text-white rounded-2xl p-6 sm:p-7 md:p-8 border border-neutral-800 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
                  POTENTIAL ANNUAL COST OF INEFFICIENCY
                </p>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                  ⚠️ Annual Overhead
                </span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
                  {formatCurrencyValue(annualCost)}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  ~{formatCurrencyValue(monthlyCost)} / month
                </span>
              </div>

              <p className="text-xs text-neutral-400 mt-2">
                Estimated financial cost of manual delay and repetitive handoffs across your team.
              </p>

              {/* 3 Secondary Metric Breakdown Pills */}
              <div className="mt-6 pt-5 border-t border-neutral-800 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase text-neutral-400">Annual Hours Lost</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-orange-400 mt-0.5">
                    {annualHoursWasted} hrs
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-neutral-400">Team Affected</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
                    {validTeamSize} {validTeamSize === 1 ? "person" : "people"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-neutral-400">Daily Overhead</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
                    {dailyHoursWasted.toFixed(1)} hrs/day
                  </p>
                </div>
              </div>
            </div>

            {/* Target Recovery Slider & Net Gain */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-bold">
                    AUTOMATION RECOVERY PROJECTION
                  </p>
                  <p className="text-sm font-extrabold text-neutral-900 mt-0.5">
                    Target Efficiency Recovery Rate
                  </p>
                </div>
                <span className="text-sm font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl">
                  {validRecoveryRate}% Recovered
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={recoveryRate}
                onChange={(e) => setRecoveryRate(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                  <p className="text-[10px] font-mono text-emerald-700 uppercase font-semibold">
                    Potential Recoverable Value
                  </p>
                  <p className="font-bold text-sm sm:text-base text-emerald-800 font-mono mt-0.5">
                    +{formatCurrencyValue(potentialRecoverableCost)}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    ~{recoverableHours} hrs/yr recovered
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-neutral-200">
                  <p className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">
                    Remaining Inefficiency
                  </p>
                  <p className="font-bold text-sm sm:text-base text-neutral-700 font-mono mt-0.5">
                    {formatCurrencyValue(remainingInefficiencyCost)}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Manual supervisory buffer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Before vs After Transformation ─────────────────────────── */}
      {analysis.before_after && (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
              WORKFLOW TRANSFORMATION
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[#111]">
              Before vs. Recommended After
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before Card */}
            <div className="bg-[#f0eee9] border-2 border-neutral-300 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-300">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold">
                      CURRENT PROCESS
                    </span>
                    <h3 className="text-lg font-bold text-neutral-900">
                      As Described
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-neutral-200 text-neutral-700 border border-neutral-300 font-semibold">
                    {analysis.before_after.before?.length || 0} Steps
                  </span>
                </div>

                <div className="space-y-4">
                  {analysis.before_after.before?.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3.5 p-3 rounded-xl bg-white/70 border border-neutral-200"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-300 text-neutral-700 font-mono text-xs flex items-center justify-center font-bold mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-neutral-700 font-medium leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-300 text-xs font-mono text-neutral-500 flex items-center gap-2">
                <span>⚠️ Manual copy-pasting, waiting for approvals</span>
              </div>
            </div>

            {/* After Card */}
            <div className="bg-[#eaf4ef] border-2 border-[#a3d4c0] rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#bfe3d5]">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold">
                      STREAMLINED FUTURE
                    </span>
                    <h3 className="text-lg font-bold text-emerald-950">
                      With Automation
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                    {analysis.before_after.after?.length || 0} Optimized Steps
                  </span>
                </div>

                <div className="space-y-4">
                  {analysis.before_after.after?.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-[#bfe3d5] shadow-xs"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-xs flex items-center justify-center font-bold mt-0.5">
                        ✓
                      </span>
                      <p className="text-sm text-emerald-950 font-medium leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#bfe3d5] text-xs font-mono text-emerald-800 font-semibold flex items-center gap-2">
                <span>✓ Faster turnaround, minimal manual touchpoints</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Friction Breakdown & Bottlenecks Diagnosis ────────────── */}
      <section className="grid lg:grid-cols-12 gap-6">
        {/* Friction Breakdown (5 cols) */}
        {analysis.friction_breakdown && (
          <div className="lg:col-span-5 bg-white border border-neutral-300 rounded-2xl p-6 md:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                  METRICS BREAKDOWN
                </p>
                <h2 className="text-xl font-bold tracking-tight text-[#111] mt-1">
                  Sources of Friction
                </h2>
              </div>

              <div className="space-y-5">
                {[
                  { label: "Manual Work", value: analysis.friction_breakdown.manual_work },
                  { label: "Repetition", value: analysis.friction_breakdown.repetition },
                  { label: "Waiting / Delays", value: analysis.friction_breakdown.waiting },
                  { label: "Handoffs & Approvals", value: analysis.friction_breakdown.handoffs },
                ].map(({ label, value }) => {
                  const val = value ?? 0;
                  const isHigh = val >= 60;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm font-medium mb-1.5">
                        <span className="text-neutral-800">{label}</span>
                        <span className={`font-mono text-xs font-bold ${isHigh ? "text-orange-600" : "text-neutral-600"}`}>
                          {val}%
                        </span>
                      </div>

                      <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                        <div
                          className={`h-full rounded-full ${
                            isHigh ? "bg-orange-500" : "bg-[#111]"
                          } transition-all duration-300`}
                          style={{ width: `${Math.min(val, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs font-mono text-neutral-400 mt-6 pt-4 border-t border-neutral-100">
              Percentages indicate relative intensity of each friction type.
            </p>
          </div>
        )}

        {/* Friction Points Diagnosis (7 cols) */}
        <div className={`${analysis.friction_breakdown ? "lg:col-span-7" : "lg:col-span-12"} bg-white border border-neutral-300 rounded-2xl p-6 md:p-7 shadow-xs`}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                DIAGNOSIS
              </p>
              <h2 className="text-xl font-bold tracking-tight text-[#111] mt-1">
                Friction Points Identified
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {analysis.friction_points?.length || 0} Bottlenecks
            </span>
          </div>

          <div className="space-y-4">
            {analysis.friction_points?.map((point, index) => {
              const sev = point.severity?.toLowerCase() || "medium";
              const isHigh = sev === "high" || sev === "critical";

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    isHigh
                      ? "border-orange-300 bg-orange-50/20 border-l-4 border-l-orange-500"
                      : "border-neutral-200 bg-neutral-50/50 border-l-4 border-l-neutral-400"
                  } transition`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-xs text-neutral-400 font-bold mt-0.5">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
                        {point.step}
                      </h3>
                    </div>

                    <span
                      className={`self-start sm:self-auto text-[11px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${getSeverityBadgeClass(
                        point.severity
                      )}`}
                    >
                      {point.severity || "MEDIUM"}
                    </span>
                  </div>

                  <div className="pl-6 mt-2 space-y-1.5">
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      <strong className="text-neutral-800">Problem:</strong> {point.problem}
                    </p>

                    {point.impact && (
                      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                        <strong className="text-neutral-800">Impact:</strong> {point.impact}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom Step Navigation Action Bar ────────────────────────── */}
      <section className="pt-4 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition shadow-xs flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
        >
          <span>←</span>
          <span>Analyze Another</span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/simulation"
            className="flex-1 sm:flex-initial text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🔮 Simulate What-If</span>
          </Link>

          <Link
            href="/automate"
            className="flex-1 sm:flex-initial text-xs font-extrabold uppercase tracking-wider bg-[#111] hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next: Automations</span>
            <span className="text-orange-400">→</span>
          </Link>
        </div>
      </section>

      {/* Executive Report Modal */}
      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        workflow={workflow}
        analysis={analysis}
        teamSize={validTeamSize}
        timeWastedMinutes={validTimeWasted}
        hourlyCost={validHourlyCost}
        currency={currency}
        annualCost={annualCost}
        potentialRecoverableCost={potentialRecoverableCost}
        annualHoursWasted={annualHoursWasted}
      />
    </main>
  );
}
