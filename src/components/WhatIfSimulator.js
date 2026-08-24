"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createOpportunitySlug } from "@/app/guide/page";
import { CURRENCIES, formatCurrencyValue } from "@/lib/constants";

export default function WhatIfSimulator({
  analysis,
  workflow,
  onOpenStarterCode,
  currency = "INR",
  teamSize: initialTeamSize = 1,
  hourlyCost: initialHourlyCost = 500,
}) {
  const baseTimeMins = Number(analysis?.estimated_time_wasted?.value) || 45;

  // Simulator Interactive Assumptions
  const [automationRate, setAutomationRate] = useState(75); // 10% - 100%
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(5); // runs per week
  const [timePerOccurrence, setTimePerOccurrence] = useState(baseTimeMins); // min per run
  const [teamCount, setTeamCount] = useState(initialTeamSize || 1); // people
  const [hourlyRate, setHourlyRate] = useState(initialHourlyCost || 500); // hourly rate

  // Target Opportunity
  const topOpportunity = analysis?.automation_opportunities?.[0] || {
    task: analysis?.top_recommendation?.title || "Workflow Automation",
    suggestion: analysis?.top_recommendation?.reason || "Automate repetitive manual steps",
    benefit: analysis?.top_recommendation?.expected_impact || "Save manual turnaround time",
    tools: ["FastAPI", "Python", "Webhooks"],
    priority: "Now",
  };

  const oppSlug = createOpportunitySlug(topOpportunity.task, 0);

  // Calculations
  const metrics = useMemo(() => {
    const validRate = Math.min(100, Math.max(10, Number(automationRate) || 75));
    const validFreq = Math.min(100, Math.max(1, Number(frequencyPerWeek) || 5));
    const validMins = Math.min(480, Math.max(1, Number(timePerOccurrence) || 45));
    const validPeople = Math.max(1, Number(teamCount) || 1);
    const validHourly = Math.max(0, Number(hourlyRate) || 500);

    // Current metrics
    const weeklyHoursCurrent = (validPeople * validFreq * validMins) / 60;
    const monthlyHoursCurrent = weeklyHoursCurrent * 4.2;
    const annualHoursCurrent = weeklyHoursCurrent * 48;
    const annualCostCurrent = Math.round(annualHoursCurrent * validHourly);
    const monthlyCostCurrent = Math.round(annualCostCurrent / 12);

    // What-If metrics
    const recoveryFraction = validRate / 100;
    const annualHoursSaved = Math.round(annualHoursCurrent * recoveryFraction);
    const monthlyHoursSaved = Number((monthlyHoursCurrent * recoveryFraction).toFixed(1));
    const annualSavings = Math.round(annualCostCurrent * recoveryFraction);
    const monthlySavings = Math.round(annualSavings / 12);

    const newTimePerOccurrence = Math.max(1, Math.round(validMins * (1 - recoveryFraction)));
    const efficiencyImprovement = Math.round(validRate * 0.9); // Realistic adjusted efficiency

    return {
      validRate,
      validFreq,
      validMins,
      validPeople,
      validHourly,
      monthlyHoursCurrent: Math.round(monthlyHoursCurrent),
      annualHoursCurrent: Math.round(annualHoursCurrent),
      annualCostCurrent,
      monthlyCostCurrent,
      monthlyHoursSaved,
      annualHoursSaved,
      annualSavings,
      monthlySavings,
      newTimePerOccurrence,
      efficiencyImprovement,
    };
  }, [automationRate, frequencyPerWeek, timePerOccurrence, teamCount, hourlyRate]);

  return (
    <section
      id="what-if-simulator"
      className="bg-white border-2 border-neutral-300 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden space-y-8"
    >
      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest font-bold bg-orange-500/15 text-orange-800 border border-orange-500/30 rounded-md">
              <span>🔮</span>
              <span>WHAT IF...?</span>
            </span>
            <span className="text-xs font-mono text-neutral-400">
              WORKFLOW IMPROVEMENT SIMULATOR
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111]">
            Simulate Your Automated Future
          </h3>

          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Change the assumptions below to see how your team&apos;s time and operational budget could improve.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-700 font-bold">
            ⚡ Real-time Projection
          </span>
        </div>
      </div>

      {/* ── 2. Interactive Assumption Controls ──────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Sliders & Controls */}
        <div className="lg:col-span-5 space-y-5 bg-neutral-50 p-5 sm:p-6 rounded-2xl border border-neutral-200 flex flex-col justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-bold mb-4">
              Simulate Key Assumptions
            </p>

            <div className="space-y-4">
              {/* 1. Automation Percentage */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Target Automation %
                  </label>
                  <span className="text-xs font-mono font-bold text-orange-600 px-2 py-0.5 rounded bg-orange-100 border border-orange-200">
                    {metrics.validRate}% Automated
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={automationRate}
                  onChange={(e) => setAutomationRate(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-1">
                  <span>10% Partial</span>
                  <span>50% Hybrid</span>
                  <span>100% Full Auto</span>
                </div>
              </div>

              {/* 2. Frequency Per Week */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Task Frequency
                  </label>
                  <span className="text-xs font-mono font-bold text-neutral-700">
                    {metrics.validFreq} times / week
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={frequencyPerWeek}
                    onChange={(e) => setFrequencyPerWeek(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="flex-1 font-mono font-bold text-sm bg-white border border-neutral-300 rounded-xl py-2 px-3 text-neutral-900 focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10, 20].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFrequencyPerWeek(f)}
                        className={`text-[11px] font-mono px-2 py-1 rounded-lg border transition cursor-pointer ${
                          metrics.validFreq === f
                            ? "bg-neutral-900 text-white font-bold"
                            : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-500"
                        }`}
                      >
                        {f === 5 ? "Daily" : `${f}x`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Time Spent Per Occurrence */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Time Per Run (Minutes)
                  </label>
                  <span className="text-xs font-mono font-bold text-neutral-700">
                    {metrics.validMins} min
                  </span>
                </div>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={timePerOccurrence}
                  onChange={(e) => setTimePerOccurrence(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full font-mono font-bold text-sm bg-white border border-neutral-300 rounded-xl py-2 px-3 text-neutral-900 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 4. Team Members Involved */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                    Team Members
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={teamCount}
                    onChange={(e) => setTeamCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full font-mono font-bold text-sm bg-white border border-neutral-300 rounded-xl py-2 px-3 text-neutral-900 text-center focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                    Hourly Wage ({CURRENCIES.find((c) => c.code === currency)?.symbol || "₹"})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full font-mono font-bold text-sm bg-white border border-neutral-300 rounded-xl py-2 px-3 text-neutral-900 text-center focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-neutral-400 border-t border-neutral-200 pt-3 mt-2">
            What-If Equation: Baseline Latency × Automation Factor × Headcount
          </p>
        </div>

        {/* Right Column: Projected Impact Comparison */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          {/* Hero Projection Callout */}
          <div className="bg-[#111111] text-white rounded-2xl p-6 sm:p-7 border border-neutral-800 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                PROJECTED OUTCOME
              </p>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                ✓ +{metrics.efficiencyImprovement}% Faster
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <h4 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                You could save approximately{" "}
                <span className="text-orange-400 underline decoration-orange-500 decoration-2 underline-offset-4">
                  {metrics.monthlyHoursSaved} hrs/mo
                </span>
                .
              </h4>
              <p className="text-xs text-neutral-400 pt-1">
                Translates to ~{metrics.annualHoursSaved} hours and +{formatCurrencyValue(metrics.annualSavings, currency)} recovered annually.
              </p>
            </div>

            {/* 3 Metrics Pills */}
            <div className="mt-5 pt-4 border-t border-neutral-800 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase text-neutral-400">Monthly Saved</p>
                <p className="text-base sm:text-lg font-bold font-mono text-orange-400 mt-0.5">
                  +{metrics.monthlyHoursSaved} hrs
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-neutral-400">Annual Value</p>
                <p className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  +{formatCurrencyValue(metrics.annualSavings, currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-neutral-400">New Run Time</p>
                <p className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                  ~{metrics.newTimePerOccurrence} min/run
                </p>
              </div>
            </div>
          </div>

          {/* Before vs After Side-by-Side Comparison */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Before */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    CURRENT STATE
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">Manual</span>
                </div>
                <div className="space-y-1.5 text-xs text-neutral-600">
                  <p>
                    <strong>Latency per item:</strong> {metrics.validMins} minutes
                  </p>
                  <p>
                    <strong>Monthly burden:</strong> ~{metrics.monthlyHoursCurrent} hours
                  </p>
                  <p>
                    <strong>Annual cost:</strong> {formatCurrencyValue(metrics.annualCostCurrent, currency)}
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-mono text-neutral-400 mt-3 pt-2 border-t border-neutral-200">
                ⚠️ High repetitive delay
              </p>
            </div>

            {/* After */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    WHAT-IF STATE
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">{metrics.validRate}% Automated</span>
                </div>
                <div className="space-y-1.5 text-xs text-emerald-950 font-medium">
                  <p>
                    <strong>Latency per item:</strong> ~{metrics.newTimePerOccurrence} minutes
                  </p>
                  <p>
                    <strong>Monthly saved:</strong> +{metrics.monthlyHoursSaved} hours
                  </p>
                  <p>
                    <strong>Annual recovered:</strong> +{formatCurrencyValue(metrics.annualSavings, currency)}
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-mono text-emerald-800 font-bold mt-3 pt-2 border-t border-emerald-200">
                ✓ Streamlined execution
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-neutral-900">
                Target: {topOpportunity.task}
              </p>
              <p className="text-[11px] text-neutral-500 font-mono">
                Launch starter scaffold or explore execution blueprint
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onOpenStarterCode && onOpenStarterCode(topOpportunity, 0)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>⚡ Generate Starter Code</span>
                <span>→</span>
              </button>

              <Link
                href={`/guide?opportunity=${oppSlug}`}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Guide →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
