"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import StarterCodeModal from "@/components/StarterCodeModal";

// Helper to convert any task name to a URL-safe slug
export function createOpportunitySlug(task, index) {
  if (!task) return `opp-${index ?? 0}`;
  const clean = task
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || `opp-${index ?? 0}`;
}

// Transform recommendation data into a comprehensive guide model
function buildGuideData(opportunity, analysis, rawSlug) {
  if (!opportunity && !analysis && !rawSlug) return null;

  const taskTitle =
    opportunity?.task ||
    (rawSlug
      ? rawSlug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "Automated Workflow Implementation");

  const priority = opportunity?.priority || "Now";
  const suggestion =
    opportunity?.suggestion ||
    "Automate repetitive manual steps using dedicated integration and parsing tools to reduce turnaround time.";
  const benefit =
    opportunity?.benefit ||
    "Eliminates manual bottlenecks, accelerates throughput, and prevents data entry errors.";
  const tools =
    opportunity?.tools && opportunity.tools.length > 0
      ? opportunity.tools
      : ["Zapier", "Make", "Google Sheets"];

  // Find related friction point from analysis if available
  const matchedFrictionPoint =
    analysis?.friction_points?.find((pt) => {
      const taskWords = taskTitle.toLowerCase().split(" ");
      const ptText = (pt.step + " " + pt.problem).toLowerCase();
      return taskWords.some((w) => w.length > 3 && ptText.includes(w));
    }) || analysis?.friction_points?.[0];

  const problemDetected =
    matchedFrictionPoint?.problem ||
    "Manual data extraction and repetitive handoffs create avoidable delays and error risk.";
  const frictionReason =
    matchedFrictionPoint?.impact ||
    "Unnecessary manual overhead slows team responsiveness and consumes valuable time every week.";

  // Current workflow steps
  const currentWorkflowSteps =
    analysis?.before_after?.before && analysis.before_after.before.length > 0
      ? analysis.before_after.before
      : [
          "Receive incoming request / document manually",
          "Open files and copy data fields individually",
          "Verify calculations and format manually",
          "Send manual updates or email attachments",
        ];

  // Recommended workflow steps
  const recommendedWorkflowSteps =
    analysis?.before_after?.after && analysis.before_after.after.length > 0
      ? analysis.before_after.after
      : [
          "Automated webhook or trigger receives payload",
          "Data parser extracts and validates required fields",
          "Target database / spreadsheet updates instantly",
          "Automated notification confirms successful execution",
        ];

  // Derive dynamic implementation steps tailored to the tools and task
  const primaryTool = tools[0] || "Automation Platform";
  const secondaryTool = tools[1] || tools[0] || "Target System";
  const tertiaryTool = tools[2] || "Notification Service";

  const implementationSteps = [
    {
      step: 1,
      title: "Configure the Trigger Event",
      description: `Set up the initiating event in ${primaryTool} (e.g., new file uploaded, email received, or form webhook). Define filter rules to capture only relevant inputs.`,
      whyItMatters:
        "Guarantees that every workflow instance starts immediately without requiring manual polling or user initiation.",
      tool: primaryTool,
    },
    {
      step: 2,
      title: "Extract & Validate Source Data",
      description: `${suggestion} Ensure essential fields (dates, reference IDs, values) are captured into structured JSON variables.`,
      whyItMatters:
        "Prevents bad or malformed inputs from breaking downstream applications and stops silent data errors at the source.",
      tool: primaryTool,
    },
    {
      step: 3,
      title: `Map Fields into ${secondaryTool}`,
      description: `Connect ${primaryTool} to ${secondaryTool}. Map all extracted variables directly into the corresponding target columns or record properties.`,
      whyItMatters:
        "Replaces manual transcription and copy-pasting with instant, accurate machine-to-machine data transfer.",
      tool: secondaryTool,
    },
    {
      step: 4,
      title: "Add Automated Verification & Alerts",
      description: `Implement an automated check. If the operation succeeds, log the timestamp; if an error occurs, send an immediate notification via ${tertiaryTool} for manual review.`,
      whyItMatters:
        "Provides total operational visibility while maintaining a reliable safety net for edge cases.",
      tool: tertiaryTool,
    },
    {
      step: 5,
      title: "Run Live Test Scenarios",
      description:
        "Send 3 sample items through the end-to-end automation. Verify that outputs match expected values in the target system before switching to full production.",
      whyItMatters:
        "Validates edge cases, schema alignment, and rule accuracy in a safe environment.",
      tool: "Test Suite",
    },
    {
      step: 6,
      title: "Deploy & Retire Manual Routine",
      description:
        "Switch the automation to active status. Update team documentation and archive the old manual checklist to ensure all future tasks flow through the new pipeline.",
      whyItMatters:
        "Locks in time savings permanently and ensures consistency across the entire team.",
      tool: "Production",
    },
  ];

  return {
    id: createOpportunitySlug(taskTitle),
    title: taskTitle,
    priority,
    suggestion,
    benefit,
    tools,
    problemDetected,
    frictionReason,
    severity: matchedFrictionPoint?.severity || analysis?.severity || "High",
    currentWorkflowSteps,
    recommendedWorkflowSteps,
    implementationSteps,
    estimatedTimeWasted: analysis?.estimated_time_wasted,
    frictionScore: analysis?.friction_score,
  };
}

function GuideContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const opportunityParam = searchParams.get("opportunity") || "";

  const [guideData, setGuideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState({
    trigger: false,
    extraction: false,
    mapping: false,
    alerts: false,
    tested: false,
    deployed: false,
  });
  const [completed, setCompleted] = useState(false);

  // Starter Code Modal State
  const [isStarterModalOpen, setIsStarterModalOpen] = useState(false);
  const [matchedOppRaw, setMatchedOppRaw] = useState(null);
  const [rawAnalysis, setRawAnalysis] = useState(null);
  const [rawWorkflow, setRawWorkflow] = useState("");

  // Ask FRICTION State
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState(null);
  const [copiedAsk, setCopiedAsk] = useState(false);

  const handleAskFriction = async (customQuestion) => {
    const q = customQuestion || askQuestion;
    if (!q.trim() || !guideData) return;

    setAskLoading(true);
    setAskError(null);
    if (customQuestion) {
      setAskQuestion(customQuestion);
    }

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          workflow: guideData.title,
          friction: `${guideData.problemDetected}: ${guideData.frictionReason}`,
          recommendation: guideData.suggestion,
          recommendedWorkflow: guideData.recommendedWorkflowSteps,
          implementationSteps: guideData.implementationSteps,
          tools: guideData.tools,
          analysis: {
            friction_score: guideData.frictionScore,
            severity: guideData.severity,
            summary: guideData.suggestion,
            top_recommendation: { title: guideData.title },
            automation_opportunities: [
              {
                task: guideData.title,
                tools: guideData.tools,
                suggestion: guideData.suggestion,
              },
            ],
          },
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
  };

  const handleCopySolution = () => {
    if (!askAnswer) return;
    const text = `FRICTION RESOLUTION:\n${askAnswer.direct_answer}\n\nACTION STEPS:\n${askAnswer.action_steps?.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nRECOMMENDED TOOLS:\n${askAnswer.recommended_tools?.join(", ")}\n\nPRO TIP:\n${askAnswer.pro_tip}`;
    navigator.clipboard.writeText(text);
    setCopiedAsk(true);
    setTimeout(() => setCopiedAsk(false), 2000);
  };

  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem("friction_analysis_data") ||
        localStorage.getItem("friction_analysis_data");

      let analysis = null;
      let matchedOpp = null;

      if (stored) {
        const parsed = JSON.parse(stored);
        analysis = parsed.analysis || parsed;
        setRawAnalysis(analysis);
        if (parsed.workflow) setRawWorkflow(parsed.workflow);

        if (analysis?.automation_opportunities?.length > 0) {
          if (opportunityParam) {
            matchedOpp = analysis.automation_opportunities.find((opp, idx) => {
              const slug = createOpportunitySlug(opp.task, idx);
              return (
                slug === opportunityParam ||
                String(idx) === opportunityParam ||
                opp.task.toLowerCase().includes(opportunityParam.replace(/-/g, " "))
              );
            });
          }

          if (!matchedOpp && analysis.automation_opportunities.length > 0) {
            matchedOpp = analysis.automation_opportunities[0];
          }
        }
      }

      if (matchedOpp || opportunityParam) {
        setMatchedOppRaw(
          matchedOpp || {
            task: guideData?.title || "Automated Workflow",
            suggestion: guideData?.suggestion || "",
            benefit: guideData?.benefit || "",
            tools: guideData?.tools || [],
          }
        );
        const data = buildGuideData(matchedOpp, analysis, opportunityParam);
        setGuideData(data);
      } else {
        setGuideData(null);
      }
    } catch (err) {
      console.error("Error loading guide data:", err);
      setGuideData(null);
    } finally {
      setLoading(false);
    }
  }, [opportunityParam]);

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedChecksCount = Object.values(checklist).filter(Boolean).length;
  const totalChecks = Object.keys(checklist).length;
  const checklistProgress = Math.round((completedChecksCount / totalChecks) * 100);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] text-[#111] px-4 py-12 sm:px-6 md:px-10 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-neutral-300 border-t-orange-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
            Loading Implementation Guide...
          </p>
        </div>
      </main>
    );
  }

  // Not Found state
  if (!guideData) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] text-[#111] px-4 py-12 sm:px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between pb-6 mb-8 border-b border-neutral-300">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#111]">
                  FRICTION
                </h1>
                <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
                  Implementation Guide
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 transition shadow-xs flex items-center gap-2"
            >
              <span>←</span> Back to Dashboard
            </Link>
          </header>

          <div className="bg-white border border-neutral-300 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center text-xl mx-auto mb-4">
              🔍
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Recommendation Not Found
            </h2>
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
              We couldn't locate this specific workflow recommendation. Please return to the dashboard and select an opportunity from your analysis report.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[#111] text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm"
            >
              <span>←</span> Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isNowPriority = guideData.priority?.toLowerCase() === "now";

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 md:px-10 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
      <div className="space-y-8 pb-20">
        {/* 1. Top Breadcrumb & Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-300">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md">
                <span>📘</span>
                <span>STEP-BY-STEP IMPLEMENTATION BLUEPRINT</span>
              </span>
              <span className="text-xs font-mono text-neutral-400">
                EXECUTION GUIDE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111]">
              Implementation Guide
            </h1>
          </div>

          <Link
            href="/automate"
            className="text-xs font-semibold uppercase tracking-wider border border-neutral-300 bg-white px-4 py-2.5 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
          >
            <span>←</span> Back to Automations
          </Link>
        </section>

        {/* Hero Banner: Selected Recommendation */}
        <section className="bg-[#111111] text-white rounded-3xl p-7 sm:p-10 border-2 border-neutral-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-mono uppercase tracking-widest font-bold bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full">
              <span>⚡</span>
              <span>{isNowPriority ? "PRIORITY: IMMEDIATE ACTION" : `PRIORITY: ${guideData.priority?.toUpperCase()}`}</span>
            </div>

            <span className="text-xs font-mono text-neutral-400">
              BLUEPRINT ID: {guideData.id}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mt-2">
            {guideData.title}
          </h2>

          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mt-4 max-w-3xl">
            {guideData.suggestion}
          </p>

          <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Recommended Stack:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {guideData.tools.map((tool, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-neutral-800 text-orange-300 border border-neutral-700"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsStarterModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>⚡ Generate Starter Code</span>
                <span>→</span>
              </button>
              <div className="text-xs font-mono text-neutral-400 hidden sm:flex items-center gap-1.5">
                <span>✓ Verified Diagnostic</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. What We're Fixing */}
        <section className="bg-white border border-neutral-300 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 mb-2 text-xs font-mono uppercase tracking-widest text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-md">
              DIAGNOSTIC TARGET
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-[#111]">
              What We're Fixing
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-4">
            <div className="p-5 rounded-xl bg-orange-50/30 border border-orange-200 border-l-4 border-l-orange-500">
              <p className="text-xs font-mono uppercase tracking-wider text-orange-700 font-bold mb-1.5">
                Problem Detected
              </p>
              <p className="text-sm text-neutral-800 font-medium leading-relaxed">
                {guideData.problemDetected}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200 border-l-4 border-l-neutral-400">
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Why It Creates Friction
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {guideData.frictionReason}
              </p>
            </div>
          </div>
        </section>

        {/* 3 & 4. Workflow Transformation (Current vs. Recommended) */}
        <section className="space-y-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 mb-2 text-xs font-mono uppercase tracking-widest text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-md">
              TRANSFORMATION FLOW
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-[#111]">
              Current vs. Recommended Workflow
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Current */}
            <div className="bg-white border-2 border-neutral-300 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                    <h4 className="font-extrabold text-xs tracking-wider uppercase text-neutral-800">
                      CURRENT (MANUAL)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                    {guideData.currentWorkflowSteps.length} Steps
                  </span>
                </div>

                <div className="space-y-3">
                  {guideData.currentWorkflowSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-700"
                    >
                      <span className="font-mono text-xs font-bold text-neutral-400 mt-0.5">
                        {idx + 1}.
                      </span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] font-mono text-neutral-500 mt-5 pt-3 border-t border-neutral-200">
                ⚠️ High manual friction and latency
              </p>
            </div>

            {/* Recommended */}
            <div className="bg-[#f2f9f6] border-2 border-[#a7dec8] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#bfe3d5]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h4 className="font-extrabold text-xs tracking-wider uppercase text-emerald-950">
                      RECOMMENDED (AUTOMATED)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                    {guideData.recommendedWorkflowSteps.length} Automated Steps
                  </span>
                </div>

                <div className="space-y-3">
                  {guideData.recommendedWorkflowSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#bfe3d5] text-xs sm:text-sm text-emerald-950 font-medium shadow-xs"
                    >
                      <span className="font-mono text-xs font-bold text-emerald-600 mt-0.5">
                        ✓
                      </span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] font-mono text-emerald-800 font-semibold mt-5 pt-3 border-t border-[#bfe3d5]">
                ✓ Instant execution without manual touchpoints
              </p>
            </div>
          </div>
        </section>

        {/* 5. Expected Impact */}
        <section className="bg-white border border-neutral-300 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 mb-2 text-xs font-mono uppercase tracking-widest text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-md">
              MEASURED OUTCOME
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-[#111]">
              Expected Impact
            </h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {guideData.estimatedTimeWasted ? (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Estimated Time Waste
                </p>
                <p className="text-2xl font-black text-[#111]">
                  ~{guideData.estimatedTimeWasted.value} {guideData.estimatedTimeWasted.unit}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Confidence: {guideData.estimatedTimeWasted.confidence || "Calculated"}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Automation Viability
                </p>
                <p className="text-2xl font-black text-emerald-600">High</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Immediate implementation readiness
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                Steps Reduced
              </p>
              <p className="text-2xl font-black text-orange-600">
                {guideData.currentWorkflowSteps.length} → {guideData.recommendedWorkflowSteps.length}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                {Math.max(0, guideData.currentWorkflowSteps.length - guideData.recommendedWorkflowSteps.length)} manual steps removed
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                Primary Benefit
              </p>
              <p className="text-sm font-bold text-neutral-900 line-clamp-2">
                {guideData.benefit}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Zero transcription errors
              </p>
            </div>
          </div>
        </section>

        {/* 6. Step-by-Step Implementation Sequence */}
        <section className="bg-white border border-neutral-300 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 mb-2 text-xs font-mono uppercase tracking-widest text-orange-700 bg-orange-500/10 border border-orange-500/20 rounded-md">
                STEP-BY-STEP BLUEPRINT
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-[#111]">
                Implementation Sequence
              </h3>
            </div>
            <p className="text-xs font-mono text-neutral-500">
              6 Structured Implementation Steps
            </p>
          </div>

          <div className="space-y-4">
            {guideData.implementationSteps.map((stepItem) => (
              <div
                key={stepItem.step}
                className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#111] text-white font-mono text-xs font-bold flex items-center justify-center">
                      {stepItem.step}
                    </span>
                    <h4 className="font-bold text-base text-neutral-900">
                      {stepItem.title}
                    </h4>
                  </div>

                  <span className="self-start sm:self-auto text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-white border border-neutral-300 text-neutral-700">
                    {stepItem.tool}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-neutral-700 leading-relaxed">
                    <strong className="text-neutral-900">What to do:</strong>{" "}
                    {stepItem.description}
                  </p>
                  <p className="text-neutral-500 text-xs leading-relaxed">
                    <strong className="text-neutral-700">Why it matters:</strong>{" "}
                    {stepItem.whyItMatters}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Recommended Tools */}
        <section className="bg-white border border-neutral-300 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 mb-2 text-xs font-mono uppercase tracking-widest text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-md">
              TECH STACK
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-[#111]">
              Recommended Automation Tools
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Platforms identified for reliable execution of this workflow
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {guideData.tools.map((tool, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-sm text-neutral-900">{tool}</p>
                  <p className="text-[11px] font-mono text-neutral-500">
                    {idx === 0 ? "Primary Engine" : idx === 1 ? "Target Destination" : "Integration Layer"}
                  </p>
                </div>
                <span className="text-xs font-mono text-orange-600 font-bold">✓ Suggested</span>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Interactive Test Checklist */}
        <section className="bg-white border border-neutral-300 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 mb-2 text-xs font-mono uppercase tracking-widest text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-md">
                QUALITY ASSURANCE
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-[#111]">
                Test & Verification Checklist
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold text-neutral-700">
                {completedChecksCount} of {totalChecks} Completed ({checklistProgress}%)
              </span>
              <div className="w-36 h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200 mt-1.5">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "trigger",
                label: "Trigger event fires reliably upon incoming new items",
              },
              {
                id: "extraction",
                label: "Data extraction correctly parses all required attributes",
              },
              {
                id: "mapping",
                label: "Field mapping correctly populates the target system",
              },
              {
                id: "alerts",
                label: "Error fallback and failure notifications are actively routed",
              },
              {
                id: "tested",
                label: "At least 3 live test cases completed with zero errors",
              },
              {
                id: "deployed",
                label: "Automation is set to production and legacy checklist archived",
              },
            ].map((check) => (
              <label
                key={check.id}
                onClick={() => toggleChecklist(check.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                  checklist[check.id]
                    ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium"
                    : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist[check.id]}
                  onChange={() => {}}
                  className="mt-0.5 h-4 w-4 rounded-sm border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm leading-snug">{check.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 9. Ask FRICTION (Implementation Copilot) */}
        <section className="bg-[#111111] text-white rounded-3xl p-7 sm:p-9 border-2 border-neutral-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-mono uppercase tracking-widest font-bold bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full">
              <span>💬</span>
              <span>ASK FRICTION — WORKFLOW COPILOT</span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              IMPLEMENTATION TROUBLESHOOTER
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mt-1">
            Have questions about this blueprint?
          </h3>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Ask anything about specific formulas, webhooks, error handling, or alternative tools.
          </p>

          {/* Quick Preset Doubts */}
          <div className="mt-5">
            <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-2">
              Quick Questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Can I build this with 100% free tools?",
                "How do I handle errors & edge cases?",
                "What if my files or formats change?",
                "Can I do this with zero code?",
              ].map((doubt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskFriction(doubt)}
                  disabled={askLoading}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-orange-500/50 transition cursor-pointer disabled:opacity-50"
                >
                  {doubt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAskFriction();
                }
              }}
              placeholder="e.g., How do I set up retry logic if an API call fails?"
              className="flex-1 rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />

            <button
              type="button"
              onClick={() => handleAskFriction()}
              disabled={!askQuestion.trim() || askLoading}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {askLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Ask FRICTION</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {askError && (
            <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs">
              ⚠️ {askError}
            </div>
          )}

          {/* Answer Box */}
          {askAnswer && (
            <div className="mt-6 pt-6 border-t border-neutral-800 space-y-5 animate-in fade-in duration-300">
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                <div className="flex items-center gap-2 mb-2 text-orange-400 text-xs font-mono uppercase tracking-wider font-bold">
                  <span>✓</span>
                  <span>FRICTION Resolution</span>
                </div>
                <p className="text-white text-sm sm:text-base leading-relaxed font-medium">
                  {askAnswer.direct_answer}
                </p>
              </div>

              {askAnswer.action_steps?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Actionable Resolution Steps:
                  </p>
                  <div className="space-y-2">
                    {askAnswer.action_steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-neutral-200"
                      >
                        <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <p className="leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {askAnswer.recommended_tools?.length > 0 && (
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
                      Recommended Tools / Tech:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {askAnswer.recommended_tools.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-neutral-800 text-orange-300 border border-neutral-700"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {askAnswer.pro_tip && (
                  <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-col justify-center">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold mb-1">
                      ⚡ Pro Tip
                    </p>
                    <p className="text-xs text-orange-200 leading-relaxed font-medium">
                      {askAnswer.pro_tip}
                    </p>
                  </div>
                )}
              </div>

              {/* Copy Solution Action */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCopySolution}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>{copiedAsk ? "✓ Copied Solution" : "📋 Copy Solution"}</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 10. Completion Action */}
        <section className="bg-white border border-neutral-300 rounded-3xl p-8 text-center shadow-xs">
          {!completed ? (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold mx-auto">
                ⚡
              </div>
              <h3 className="text-2xl font-bold text-[#111] tracking-tight">
                Ready to improve this workflow?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Once you have connected your tools and verified your live test cases, mark this recommendation as completed.
              </p>

              <button
                type="button"
                onClick={() => setCompleted(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#111] text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>I've completed this</span>
                <span>→</span>
              </button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl mx-auto">
                ✓
              </div>
              <h3 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
                Workflow Improvement Complete
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Great job! You've documented and planned the resolution for this bottleneck. You can return to your dashboard to review other optimization opportunities.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/automate"
                  className="px-8 py-3.5 rounded-xl bg-[#111] text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm inline-flex items-center justify-center gap-2"
                >
                  <span>←</span> Back to Automations
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Starter Code Generator Modal */}
        <StarterCodeModal
          isOpen={isStarterModalOpen}
          onClose={() => setIsStarterModalOpen(false)}
          opportunity={
            matchedOppRaw || {
              task: guideData.title,
              suggestion: guideData.suggestion,
              benefit: guideData.benefit,
              tools: guideData.tools,
              priority: guideData.priority,
            }
          }
          opportunityIndex={0}
          workflow={rawWorkflow || guideData.title}
          analysis={
            rawAnalysis || {
              friction_points: [
                {
                  problem: guideData.problemDetected,
                  impact: guideData.frictionReason,
                },
              ],
              estimated_time_wasted: guideData.estimatedTimeWasted,
            }
          }
        />
      </div>
    </main>
  );
}

export default function GuidePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f4f0] text-[#111] px-4 py-12 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-neutral-300 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
              Loading Guide...
            </p>
          </div>
        </main>
      }
    >
      <GuideContent />
    </Suspense>
  );
}
