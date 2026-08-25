"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CURRENCIES } from "@/lib/constants";

const FrictionContext = createContext(null);

export function FrictionProvider({ children }) {
  // ── Core analysis state ─────────────────────────────────────────────────
  const [workflow, setWorkflow] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── ROI Calculator state ─────────────────────────────────────────────────
  const [teamSize, setTeamSize] = useState(1);
  const [timeWastedMinutes, setTimeWastedMinutes] = useState(45);
  const [hourlyCost, setHourlyCost] = useState(500);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [weeksPerYear, setWeeksPerYear] = useState(48);
  const [currency, setCurrency] = useState("INR");
  const [recoveryRate, setRecoveryRate] = useState(75);

  // ── Ask FRICTION state ───────────────────────────────────────────────────
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState(null);
  const [copiedAsk, setCopiedAsk] = useState(false);

  // ── Restore session on mount ─────────────────────────────────────────────
  // This MUST run in an effect, not a lazy initializer: localStorage/
  // sessionStorage don't exist on the server, so reading them during the
  // initial render would make the client's first render disagree with the
  // server-rendered HTML and trigger a hydration mismatch. Running it in an
  // effect means the first client render matches the server, then updates
  // right after — the correct pattern here despite the lint rule.
  useEffect(() => {
    try {
      const saved =
        sessionStorage.getItem("friction_analysis_data") ||
        localStorage.getItem("friction_analysis_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.analysis) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setResult(parsed);
          if (parsed.workflow) setWorkflow(parsed.workflow);
          if (parsed.analysis.estimated_time_wasted?.value) {
            setTimeWastedMinutes(
              Number(parsed.analysis.estimated_time_wasted.value) || 45
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to restore saved analysis:", err);
    }
  }, []);

  // ── Analysis action ──────────────────────────────────────────────────────
  // Returns the result data (or { error } object) so callers can redirect.
  const handleAnalyze = useCallback(async (workflowText) => {
    const wf = workflowText || workflow;
    if (!wf.trim()) return null;

    setLoading(true);
    setResult(null);
    setAskAnswer(null);
    setAskQuestion("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: wf }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong during analysis");
      }

      setResult(data);

      if (data?.analysis?.estimated_time_wasted?.value) {
        setTimeWastedMinutes(
          Number(data.analysis.estimated_time_wasted.value) || 45
        );
      }

      // Persist for guide page and page refreshes
      try {
        const savePayload = { ...data, workflow: wf };
        sessionStorage.setItem(
          "friction_analysis_data",
          JSON.stringify(savePayload)
        );
        localStorage.setItem(
          "friction_analysis_data",
          JSON.stringify(savePayload)
        );
      } catch (e) {
        console.error("Storage save failed:", e);
      }

      return data;
    } catch (error) {
      console.error("Analysis request failed:", error);
      const errResult = { error: error.message };
      setResult(errResult);
      return errResult;
    } finally {
      setLoading(false);
    }
  }, [workflow]);

  // ── Reset all state ──────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    try {
      sessionStorage.removeItem("friction_analysis_data");
      localStorage.removeItem("friction_analysis_data");
    } catch (e) {}
    setResult(null);
    setWorkflow("");
    setAskQuestion("");
    setAskAnswer(null);
    setAskError(null);
    setCopiedAsk(false);
    setTeamSize(1);
    setTimeWastedMinutes(45);
    setHourlyCost(500);
    setDaysPerWeek(5);
    setWeeksPerYear(48);
    setCurrency("INR");
    setRecoveryRate(75);
  }, []);

  // ── Ask FRICTION action ──────────────────────────────────────────────────
  const handleAskFriction = useCallback(async (customQuestion) => {
    const q = customQuestion || askQuestion;
    if (!q.trim()) return;

    setAskLoading(true);
    setAskError(null);
    if (customQuestion) setAskQuestion(customQuestion);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          workflow,
          friction: result?.analysis?.friction_points,
          recommendation: result?.analysis?.top_recommendation,
          recommendedWorkflow: result?.analysis?.recommended_workflow,
          tools: result?.analysis?.automation_opportunities?.flatMap(
            (o) => o.tools || []
          ),
          analysis: result?.analysis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get solution");
      }

      setAskAnswer(data.answer);
    } catch (err) {
      console.error("Ask FRICTION failed:", err);
      setAskError(err.message || "Failed to consult FRICTION");
    } finally {
      setAskLoading(false);
    }
  }, [askQuestion, workflow, result]);

  const handleCopySolution = useCallback(() => {
    if (!askAnswer) return;
    const text = `FRICTION RESOLUTION:\n${askAnswer.direct_answer}\n\nACTION STEPS:\n${askAnswer.action_steps
      ?.map((s, i) => `${i + 1}. ${s}`)
      .join("\n")}\n\nRECOMMENDED TOOLS:\n${askAnswer.recommended_tools?.join(
      ", "
    )}\n\nPRO TIP:\n${askAnswer.pro_tip}`;
    navigator.clipboard.writeText(text);
    setCopiedAsk(true);
    setTimeout(() => setCopiedAsk(false), 2000);
  }, [askAnswer]);

  // ── ROI derived values ───────────────────────────────────────────────────
  const validTeamSize = Math.max(1, parseInt(teamSize, 10) || 1);
  const validTimeWasted = Math.max(0, parseFloat(timeWastedMinutes) || 0);
  const validHourlyCost = Math.max(0, parseFloat(hourlyCost) || 0);
  const validDaysPerWeek = Math.min(7, Math.max(1, parseInt(daysPerWeek, 10) || 5));
  const validWeeksPerYear = Math.min(52, Math.max(1, parseInt(weeksPerYear, 10) || 48));
  const validRecoveryRate = Math.min(100, Math.max(10, parseInt(recoveryRate, 10) || 75));

  const dailyHoursWasted = (validTeamSize * validTimeWasted) / 60;
  const weeklyHoursWasted = dailyHoursWasted * validDaysPerWeek;
  const annualHoursWasted = Math.round(weeklyHoursWasted * validWeeksPerYear);
  const annualCost = Math.round(annualHoursWasted * validHourlyCost);
  const monthlyCost = Math.round(annualCost / 12);
  const potentialRecoverableCost = Math.round(annualCost * (validRecoveryRate / 100));
  const remainingInefficiencyCost = Math.max(0, annualCost - potentialRecoverableCost);
  const recoverableHours = Math.round(annualHoursWasted * (validRecoveryRate / 100));

  const formatCurrencyValue = useCallback(
    (amount, currCode = currency) => {
      const num = Math.round(Number(amount) || 0);
      const curr = CURRENCIES.find((c) => c.code === currCode) || CURRENCIES[0];
      try {
        return new Intl.NumberFormat(curr.locale, {
          style: "currency",
          currency: curr.code,
          maximumFractionDigits: 0,
        }).format(num);
      } catch (e) {
        return `${curr.symbol}${num.toLocaleString()}`;
      }
    },
    [currency]
  );

  // ── Context value ────────────────────────────────────────────────────────
  const value = {
    // Core
    workflow,
    setWorkflow,
    result,
    setResult,
    loading,
    // Actions
    handleAnalyze,
    handleReset,
    // Ask FRICTION
    askQuestion,
    setAskQuestion,
    askAnswer,
    setAskAnswer,
    askLoading,
    askError,
    setAskError,
    copiedAsk,
    handleAskFriction,
    handleCopySolution,
    // ROI inputs
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
    // ROI derived
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
  };

  return (
    <FrictionContext.Provider value={value}>
      {children}
    </FrictionContext.Provider>
  );
}

export function useFriction() {
  const ctx = useContext(FrictionContext);
  if (!ctx) {
    throw new Error("useFriction must be used inside <FrictionProvider>");
  }
  return ctx;
}
