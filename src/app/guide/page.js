"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

// Safely normalize estimated time wasted from different AI output formats
function normalizeEstimatedTime(value) {
  if (value == null) return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return {
      minutes: value,
      unit: "min/day",
      confidence: "Calculated",
    };
  }

  if (typeof value === "string") {
    const match = value.match(/[\d.]+/);

    if (match) {
      return {
        minutes: Number(match[0]),
        unit: value.toLowerCase().includes("hour") ? "hours/day" : "min/day",
        confidence: "Calculated",
      };
    }

    return {
      display: value,
      confidence: "Calculated",
    };
  }

  if (typeof value === "object") {
    const minutes =
      value.minutes_per_day ??
      value.minutes ??
      value.daily_minutes ??
      value.time_wasted_minutes ??
      value.value ??
      null;

    const hours =
      value.hours_per_day ??
      value.hours ??
      value.daily_hours ??
      null;

    if (hours != null && Number.isFinite(Number(hours))) {
      return {
        minutes: Number(hours) * 60,
        hours: Number(hours),
        unit: "hours/day",
        confidence: value.confidence || "Calculated",
      };
    }

    if (minutes != null && Number.isFinite(Number(minutes))) {
      return {
        minutes: Number(minutes),
        unit: "min/day",
        confidence: value.confidence || "Calculated",
      };
    }

    return {
      display:
        value.display ||
        value.formatted ||
        value.description ||
        "Estimated",
      confidence: value.confidence || "Calculated",
    };
  }

  return null;
}

// Transform recommendation data into a comprehensive guide model
function buildGuideData(opportunity, analysis, rawSlug, opportunityIndex = 0) {
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
    Array.isArray(opportunity?.tools) && opportunity.tools.length > 0
      ? opportunity.tools
      : ["n8n / Make", "Python + pandas", "Slack + Google Drive"];

  // Find related friction point from analysis if available
  const matchedFrictionPoint =
    analysis?.friction_points?.find((pt) => {
      const taskWords = taskTitle.toLowerCase().split(/\s+/);

      const ptText = (
        (pt?.step || "") +
        " " +
        (pt?.problem || "") +
        " " +
        (pt?.impact || "")
      ).toLowerCase();

      return taskWords.some(
        (word) => word.length > 3 && ptText.includes(word)
      );
    }) || analysis?.friction_points?.[0];

  const problemDetected =
    matchedFrictionPoint?.problem ||
    "Manual data extraction and repetitive handoffs create avoidable delays and error risk.";

  const frictionReason =
    matchedFrictionPoint?.impact ||
    "Unnecessary manual overhead slows team responsiveness and consumes valuable time every week.";

  // Current workflow steps
  const currentWorkflowSteps =
    Array.isArray(analysis?.before_after?.before) &&
    analysis.before_after.before.length > 0
      ? analysis.before_after.before
      : [
          "Receive incoming request / document manually",
          "Open files and copy data fields individually",
          "Verify calculations and format manually",
          "Send manual updates or email attachments",
        ];

  // Recommended workflow steps
  const recommendedWorkflowSteps =
    Array.isArray(analysis?.before_after?.after) &&
    analysis.before_after.after.length > 0
      ? analysis.before_after.after
      : [
          "Automated webhook or trigger receives payload",
          "Data parser extracts and validates required fields",
          "Target database / spreadsheet updates instantly",
          "Automated notification confirms successful execution",
        ];

  // Consistent implementation stack
  const primaryTool = "n8n / Make";

  const implementationSteps = [
    {
      step: 1,
      title: "Configure the Workflow Trigger",
      description:
        "Set up a scheduled trigger, webhook, or event-based trigger to automatically start the workflow when the required input becomes available.",
      whyItMatters:
        "Removes the need for someone to manually start the workflow and ensures execution happens consistently.",
      tool: primaryTool,
    },
    {
      step: 2,
      title: "Extract & Validate Input Data",
      description:
        "Read the incoming data, validate required fields, and flag missing or invalid values before continuing to the next stage.",
      whyItMatters:
        "Prevents incomplete or incorrect data from reaching downstream systems and reduces manual verification.",
      tool: "Python + pandas",
    },
    {
      step: 3,
      title: "Transform & Generate the Output",
      description:
        "Transform the validated data into the required structure and automatically generate the report, record, or output required by the workflow.",
      whyItMatters:
        "Eliminates repetitive copy-pasting and makes the final output consistent every time.",
      tool: "Python + automation",
    },
    {
      step: 4,
      title: "Add Human Approval & Notifications",
      description:
        "Send the generated result to the appropriate person through Slack or another communication channel for review when human approval is required.",
      whyItMatters:
        "Preserves necessary human oversight while removing unnecessary manual handoffs and waiting time.",
      tool: "Slack",
    },
    {
      step: 5,
      title: "Save the Final Output",
      description:
        "After approval or successful validation, automatically store the final result in the designated Google Drive folder or target system.",
      whyItMatters:
        "Eliminates the final manual upload step and creates a consistent destination for completed work.",
      tool: "Google Drive API",
    },
    {
      step: 6,
      title: "Test, Monitor & Deploy",
      description:
        "Run at least three representative test cases, verify the complete workflow, check failure paths, and then enable the automation for production.",
      whyItMatters:
        "Confirms that extraction, transformation, approval, notification, and storage work correctly before replacing the manual process.",
      tool: "Test Suite / Production",
    },
  ];

  const estimatedTimeWasted = normalizeEstimatedTime(
    analysis?.estimated_time_wasted
  );

  return {
    id: createOpportunitySlug(taskTitle, opportunityIndex),
    title: taskTitle,
    priority,
    suggestion,
    benefit,
    tools,
    problemDetected,
    frictionReason,
    currentWorkflowSteps,
    recommendedWorkflowSteps,
    implementationSteps,
    estimatedTimeWasted,
    frictionScore: analysis?.friction_score ?? opportunity?.friction_score ?? null,
    severity: analysis?.severity ?? opportunity?.severity ?? null,
  };
}

function GuideContent() {
  const searchParams = useSearchParams();

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
        headers: {
          "Content-Type": "application/json",
        },
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

            top_recommendation: {
              title: guideData.title,
            },

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

      setAskError(
        err.message || "Failed to consult FRICTION"
      );
    } finally {
      setAskLoading(false);
    }
  };

  const handleCopySolution = () => {
    if (!askAnswer) return;

    const text = `FRICTION RESOLUTION:
${askAnswer.direct_answer || ""}

ACTION STEPS:
${askAnswer.action_steps
  ?.map((s, i) => `${i + 1}. ${s}`)
  .join("\n") || ""}

RECOMMENDED TOOLS:
${askAnswer.recommended_tools?.join(", ") || ""}

PRO TIP:
${askAnswer.pro_tip || ""}`;

    navigator.clipboard.writeText(text);

    setCopiedAsk(true);

    setTimeout(() => {
      setCopiedAsk(false);
    }, 2000);
  };

  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem("friction_analysis_data") ||
        localStorage.getItem("friction_analysis_data");

      let analysis = null;
      let matchedOpp = null;
      let workflow = "";

      if (stored) {
        const parsed = JSON.parse(stored);

        analysis = parsed.analysis || parsed;

        workflow = parsed.workflow || "";

        // Hydrating from sessionStorage on mount — a legitimate sync with an
        // external system, not a derivable render value — so
        // set-state-in-effect is intentionally suppressed here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRawAnalysis(analysis);
        setRawWorkflow(workflow);

        if (
          Array.isArray(analysis?.automation_opportunities) &&
          analysis.automation_opportunities.length > 0
        ) {
          if (opportunityParam) {
            matchedOpp =
              analysis.automation_opportunities.find(
                (opp, idx) => {
                  const slug = createOpportunitySlug(
                    opp?.task,
                    idx
                  );

                  const taskText =
                    typeof opp?.task === "string"
                      ? opp.task.toLowerCase()
                      : "";

                  const searchText =
                    opportunityParam
                      .replace(/-/g, " ")
                      .toLowerCase();

                  return (
                    slug === opportunityParam ||
                    String(idx) === opportunityParam ||
                    taskText.includes(searchText)
                  );
                }
              );
          }

          if (
            !matchedOpp &&
            analysis.automation_opportunities.length > 0
          ) {
            matchedOpp =
              analysis.automation_opportunities[0];
          }
        }
      }

      if (matchedOpp || opportunityParam) {
        setMatchedOppRaw(
          matchedOpp || {
            task: "Automated Workflow",
            suggestion: "",
            benefit: "",
            tools: [],
            priority: "Now",
          }
        );

        const matchedIndex =
          matchedOpp &&
          Array.isArray(analysis?.automation_opportunities)
            ? analysis.automation_opportunities.indexOf(
                matchedOpp
              )
            : 0;

        const data = buildGuideData(
          matchedOpp,
          analysis,
          opportunityParam,
          matchedIndex >= 0 ? matchedIndex : 0
        );

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
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const completedChecksCount =
    Object.values(checklist).filter(Boolean).length;

  const totalChecks = Object.keys(checklist).length;

  const checklistProgress = Math.round(
    (completedChecksCount / totalChecks) * 100
  );

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
              <span>←</span>
              Back to Dashboard
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
              We couldn&apos;t locate this specific workflow
              recommendation. Please return to the dashboard and
              select an opportunity from your analysis report.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[#111] text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm"
            >
              <span>←</span>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isNowPriority =
    guideData.priority?.toLowerCase() === "now";

  const timeWaste = guideData.estimatedTimeWasted;

  const timeWasteDisplay = timeWaste
    ? timeWaste.display
      ? timeWaste.display
      : timeWaste.hours != null
      ? `~${timeWaste.hours} hr/day`
      : timeWaste.minutes != null
      ? `~${Math.round(timeWaste.minutes)} min/day`
      : "Estimated"
    : null;

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 md:px-10 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
      <div className="space-y-8 pb-20">

        {/* 1. Top Breadcrumb & Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-300">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md">
                <span>📘</span>
                <span>
                  STEP-BY-STEP IMPLEMENTATION BLUEPRINT
                </span>
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
            <span>←</span>
            Back to Automations
          </Link>
        </section>

        {/* Hero Banner */}
        <section className="bg-[#111111] text-white rounded-3xl p-7 sm:p-10 border-2 border-neutral-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-mono uppercase tracking-widest font-bold bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full">
              <span>⚡</span>

              <span>
                {isNowPriority
                  ? "PRIORITY: IMMEDIATE ACTION"
                  : `PRIORITY: ${guideData.priority?.toUpperCase()}`}
              </span>
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
                onClick={() =>
                  setIsStarterModalOpen(true)
                }
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
              What We&apos;re Fixing
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

        {/* 3 & 4. Workflow Transformation */}
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
                  {guideData.currentWorkflowSteps.map(
                    (step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-700"
                      >
                        <span className="font-mono text-xs font-bold text-neutral-400 mt-0.5">
                          {idx + 1}.
                        </span>

                        <p className="leading-relaxed">
                          {step}
                        </p>
                      </div>
                    )
                  )}
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
                  {guideData.recommendedWorkflowSteps.map(
                    (step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#bfe3d5] text-xs sm:text-sm text-emerald-950 font-medium shadow-xs"
                      >
                        <span className="font-mono text-xs font-bold text-emerald-600 mt-0.5">
                          ✓
                        </span>

                        <p className="leading-relaxed">
                          {step}
                        </p>
                      </div>
                    )
                  )}
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

            {/* Time Waste */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                Estimated Time Waste
              </p>

              {timeWasteDisplay ? (
                <>
                  <p className="text-2xl font-black text-[#111]">
                    {timeWasteDisplay}
                  </p>

                  {timeWaste?.confidence && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Confidence:{" "}
                      {timeWaste.confidence}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-emerald-600">
                    High
                  </p>

                  <p className="text-[11px] text-neutral-500 mt-1">
                    Immediate implementation readiness
                  </p>
                </>
              )}
            </div>

            {/* Steps Reduced */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                Steps Reduced
              </p>

              <p className="text-2xl font-black text-orange-600">
                {guideData.currentWorkflowSteps.length} →{" "}
                {guideData.recommendedWorkflowSteps.length}
              </p>

              <p className="text-[11px] text-neutral-500 mt-1">
                {Math.max(
                  0,
                  guideData.currentWorkflowSteps.length -
                    guideData.recommendedWorkflowSteps.length
                )}{" "}
                manual steps removed
              </p>
            </div>

            {/* Primary Benefit */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                Primary Benefit
              </p>

              <p className="text-sm font-bold text-neutral-900 line-clamp-2">
                {guideData.benefit}
              </p>

              <p className="text-[11px] text-neutral-500 mt-1">
                Reduced manual error risk
              </p>
            </div>
          </div>
        </section>

        {/* 6. Implementation Sequence */}
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
            {guideData.implementationSteps.map(
              (stepItem) => (
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
                      <strong className="text-neutral-900">
                        What to do:
                      </strong>{" "}
                      {stepItem.description}
                    </p>

                    <p className="text-neutral-500 text-xs leading-relaxed">
                      <strong className="text-neutral-700">
                        Why it matters:
                      </strong>{" "}
                      {stepItem.whyItMatters}
                    </p>
                  </div>
                </div>
              )
            )}
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
              Platforms identified for reliable execution of this
              workflow
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {guideData.tools.map((tool, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-sm text-neutral-900">
                    {tool}
                  </p>

                  <p className="text-[11px] font-mono text-neutral-500">
                    {idx === 0
                      ? "Primary Engine"
                      : idx === 1
                      ? "Data Processing"
                      : "Integration Layer"}
                  </p>
                </div>

                <span className="text-xs font-mono text-orange-600 font-bold">
                  ✓ Suggested
                </span>
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
                {completedChecksCount} of {totalChecks} Completed (
                {checklistProgress}%)
              </span>

              <div className="w-36 h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200 mt-1.5">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${checklistProgress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "trigger",
                label:
                  "Trigger event fires reliably upon incoming new items",
              },
              {
                id: "extraction",
                label:
                  "Data extraction correctly parses all required attributes",
              },
              {
                id: "mapping",
                label:
                  "Field mapping correctly populates the target system",
              },
              {
                id: "alerts",
                label:
                  "Error fallback and failure notifications are actively routed",
              },
              {
                id: "tested",
                label:
                  "At least 3 live test cases completed with zero errors",
              },
              {
                id: "deployed",
                label:
                  "Automation is set to production and legacy checklist archived",
              },
            ].map((check) => (
              <label
                key={check.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                  checklist[check.id]
                    ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium"
                    : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist[check.id]}
                  onChange={() =>
                    toggleChecklist(check.id)
                  }
                  className="mt-0.5 h-4 w-4 rounded-sm border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />

                <span className="text-sm leading-snug">
                  {check.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* 9. Ask FRICTION */}
        <section className="bg-[#111111] text-white rounded-3xl p-7 sm:p-9 border-2 border-neutral-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-mono uppercase tracking-widest font-bold bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full">
              <span>💬</span>
              <span>
                ASK FRICTION — WORKFLOW COPILOT
              </span>
            </div>

            <span className="text-xs font-mono text-neutral-400">
              IMPLEMENTATION TROUBLESHOOTER
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mt-1">
            Have questions about this blueprint?
          </h3>

          <p className="text-neutral-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Ask anything about specific formulas, webhooks,
            error handling, or alternative tools.
          </p>

          {/* Quick Questions */}
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
                  onClick={() =>
                    handleAskFriction(doubt)
                  }
                  disabled={askLoading}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-orange-500/50 transition cursor-pointer disabled:opacity-50"
                >
                  {doubt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={askQuestion}
              onChange={(e) =>
                setAskQuestion(e.target.value)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
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
              disabled={
                !askQuestion.trim() || askLoading
              }
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {askLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
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

          {/* Error */}
          {askError && (
            <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs">
              ⚠️ {askError}
            </div>
          )}

          {/* Answer */}
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
                    {askAnswer.action_steps.map(
                      (step, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-neutral-200"
                        >
                          <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>

                          <p className="leading-relaxed">
                            {step}
                          </p>
                        </div>
                      )
                    )}
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
                      {askAnswer.recommended_tools.map(
                        (tool, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-neutral-800 text-orange-300 border border-neutral-700"
                          >
                            {tool}
                          </span>
                        )
                      )}
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

              {/* Copy Solution */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCopySolution}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>
                    {copiedAsk
                      ? "✓ Copied Solution"
                      : "📋 Copy Solution"}
                  </span>
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
                Once you have connected your tools and verified
                your live test cases, mark this recommendation as
                completed.
              </p>

              <button
                type="button"
                onClick={() => setCompleted(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#111] text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>I&apos;ve completed this</span>
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
                Great job! You&apos;ve documented and planned the
                resolution for this bottleneck. You can return to
                your dashboard to review other optimization
                opportunities.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/automate"
                  className="px-8 py-3.5 rounded-xl bg-[#111] text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm inline-flex items-center justify-center gap-2"
                >
                  <span>←</span>
                  Back to Automations
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Starter Code Generator Modal */}
        <StarterCodeModal
          isOpen={isStarterModalOpen}
          onClose={() =>
            setIsStarterModalOpen(false)
          }
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
          workflow={
            rawWorkflow || guideData.title
          }
          analysis={
            rawAnalysis || {
              friction_points: [
                {
                  problem: guideData.problemDetected,
                  impact: guideData.frictionReason,
                },
              ],
              estimated_time_wasted:
                guideData.estimatedTimeWasted,
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