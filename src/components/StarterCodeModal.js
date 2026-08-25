"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createOpportunitySlug } from "@/app/guide/page";

export default function StarterCodeModal({
  isOpen,
  onClose,
  opportunity,
  opportunityIndex,
  workflow,
  analysis,
}) {
  const [language, setLanguage] = useState("Python");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState(null);
  const [starterData, setStarterData] = useState(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const slug = createOpportunitySlug(opportunity?.task, opportunityIndex);

  // Staged loading effect.
  // Advances the UI on a timer while a request is in flight — an external
  // timer, not a derivable render value — so set-state-in-effect is
  // intentionally suppressed here.
  useEffect(() => {
    if (loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingStage(0);
      const t1 = setTimeout(() => setLoadingStage(1), 1200);
      const t2 = setTimeout(() => setLoadingStage(2), 2800);
      const t3 = setTimeout(() => setLoadingStage(3), 4800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [loading]);

  const generateStarterCode = useCallback(async (selectedLang = language) => {
    if (!opportunity) return;

    setLoading(true);
    setError(null);
    setStarterData(null);
    setActiveFileIndex(0);

    try {
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow,
          opportunity,
          frictionPoints: analysis?.friction_points || [],
          tools: opportunity.tools || [],
          language: selectedLang,
          estimatedTimeWasted: analysis?.estimated_time_wasted,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "We couldn't generate the starter right now. Your analysis is safe — try again."
        );
      }

      setStarterData(data.starterProject);
    } catch (err) {
      console.error("Starter code generation error:", err);
      setError(
        err.message || "We couldn't generate the starter right now. Your analysis is safe — try again."
      );
    } finally {
      setLoading(false);
    }
  }, [opportunity, workflow, analysis, language]);

  // Generate on open.
  // Fetches starter code when the modal opens for a given opportunity — a
  // standard "sync with an external system" effect, so set-state-in-effect
  // is intentionally suppressed. `generateStarterCode` and `language` are
  // deliberately left out of the dependency array: language switches are
  // already handled explicitly by handleLanguageChange below, and including
  // them here would trigger a duplicate fetch on every language change.
  useEffect(() => {
    if (isOpen && opportunity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      generateStarterCode(language);
    } else {
      setStarterData(null);
      setError(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, opportunity]);

  // Handle language switch
  const handleLanguageChange = (newLang) => {
    if (newLang === language && starterData) return;
    setLanguage(newLang);
    generateStarterCode(newLang);
  };

  const handleCopyActiveCode = () => {
    const file = starterData?.files?.[activeFileIndex];
    if (!file?.content) return;
    navigator.clipboard.writeText(file.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadActiveFile = () => {
    const file = starterData?.files?.[activeFileIndex];
    if (!file) return;

    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllFiles = () => {
    if (!starterData?.files?.length) return;
    starterData.files.forEach((file, i) => {
      setTimeout(() => {
        const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, i * 200);
    });
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  if (!isOpen) return null;

  const activeFile = starterData?.files?.[activeFileIndex] || starterData?.files?.[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[#f5f4f0] rounded-3xl border-2 border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* ── 1. Top Header Bar ────────────────────────────────────────── */}
        <div className="bg-[#111] text-white px-6 py-4 flex items-center justify-between border-b border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  1-Click Starter Code Generator
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold">
                  PROTOTYPE SCAFFOLD
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">
                Targeted automation template for {opportunity?.task || "workflow"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ── 2. Modal Body (Scrollable) ───────────────────────────────── */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {/* Opportunity Context Card */}
          <div className="bg-white border border-neutral-300 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-neutral-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full font-bold">
                  {opportunity?.priority ? `PRIORITY: ${opportunity.priority.toUpperCase()}` : "OPPORTUNITY"}
                </span>
                <h4 className="text-lg font-extrabold text-neutral-900 mt-1">
                  {opportunity?.task}
                </h4>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-300 self-start md:self-auto">
                <span className="text-[11px] font-mono text-neutral-500 px-2 font-semibold uppercase">
                  Language:
                </span>
                {["Python", "JavaScript"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    disabled={loading}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                      language === lang
                        ? "bg-[#111] text-white shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                    }`}
                  >
                    {lang === "Python" ? "🐍 Python" : "🟨 Node.js / JS"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <p className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">Why Automate?</p>
                <p className="text-neutral-800 font-medium mt-0.5 leading-snug">
                  {opportunity?.benefit || "Eliminates manual delays and data entry overhead."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <p className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">Recommended Stack</p>
                <p className="text-neutral-800 font-bold mt-0.5">
                  {starterData?.framework || (language === "Python" ? "FastAPI / Python" : "Node.js / Express")}
                </p>
                <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                  {opportunity?.tools?.join(", ") || "Standard API Client"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <p className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">Estimated Impact</p>
                <p className="text-emerald-700 font-bold text-sm mt-0.5">
                  {analysis?.estimated_time_wasted?.value
                    ? `~${analysis.estimated_time_wasted.value} ${analysis.estimated_time_wasted.unit || "min/day"} saved`
                    : "High throughput recovery"}
                </p>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Zero manual transcription</p>
              </div>
            </div>
          </div>

          {/* ── Loading Animation ────────────────────────────────────────── */}
          {loading && (
            <div className="bg-white border-2 border-neutral-300 rounded-2xl p-8 sm:p-12 text-center shadow-sm space-y-6">
              <div className="relative w-14 h-14 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />
                <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                  {language === "Python" ? "🐍" : "⚡"}
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xl font-black text-neutral-900 tracking-tight">
                  {loadingStage === 0 && "Understanding automation opportunity..."}
                  {loadingStage === 1 && "Choosing implementation approach..."}
                  {loadingStage === 2 && "Generating starter project..."}
                  {loadingStage >= 3 && "Preparing files & dependencies..."}
                </h4>
                <p className="text-xs text-neutral-500 font-mono">
                  Writing clean, commented, runnable {language} scaffold with secrets safely isolated.
                </p>
              </div>

              <div className="max-w-xs mx-auto flex items-center justify-between text-[10px] font-mono pt-1 text-neutral-400">
                <span className={loadingStage >= 0 ? "text-orange-600 font-bold" : ""}>1. Inspect</span>
                <span>──</span>
                <span className={loadingStage >= 1 ? "text-orange-600 font-bold" : ""}>2. Architecture</span>
                <span>──</span>
                <span className={loadingStage >= 2 ? "text-orange-600 font-bold" : ""}>3. Code</span>
                <span>──</span>
                <span className={loadingStage >= 3 ? "text-orange-600 font-bold" : ""}>4. Ready</span>
              </div>
            </div>
          )}

          {/* ── Error Notification ───────────────────────────────────────── */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-lg mx-auto">
                ⚠️
              </div>
              <p className="text-sm font-bold text-red-900">Code Generation Encountered an Issue</p>
              <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
              <button
                type="button"
                onClick={() => generateStarterCode(language)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition cursor-pointer"
              >
                Try Again ↺
              </button>
            </div>
          )}

          {/* ── Generated Code Explorer ──────────────────────────────────── */}
          {starterData && !loading && (
            <div className="space-y-4">
              <div className="bg-[#111] text-white rounded-2xl border-2 border-neutral-800 shadow-xl overflow-hidden">
                {/* File Tabs & Actions Toolbar */}
                <div className="bg-neutral-950 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800">
                  {/* File Selector Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                    {starterData.files?.map((file, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveFileIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          activeFileIndex === idx
                            ? "bg-neutral-800 text-orange-400 border border-neutral-700 font-bold shadow-xs"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                        }`}
                      >
                        <span>
                          {file.name.endsWith(".py")
                            ? "🐍"
                            : file.name.endsWith(".js") || file.name.endsWith(".json")
                            ? "📄"
                            : file.name.includes(".env")
                            ? "🔒"
                            : "📝"}
                        </span>
                        <span>{file.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Copy & Download Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyActiveCode}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 border border-neutral-700"
                    >
                      <span>{copiedCode ? "✓ Copied" : "📋 Copy File"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadActiveFile}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 border border-neutral-700"
                    >
                      <span>⬇ Download File</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadAllFiles}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>{copiedAll ? "✓ Downloading..." : "⬇ Download All"}</span>
                    </button>
                  </div>
                </div>

                {/* Code Content Area */}
                <div className="p-4 sm:p-5 overflow-x-auto max-h-[420px] overflow-y-auto font-mono text-xs text-neutral-200 leading-relaxed bg-[#111]">
                  <pre className="whitespace-pre">
                    <code>{activeFile?.content || "// No content"}</code>
                  </pre>
                </div>
              </div>

              {/* ── Environment Variables & Setup Instructions ──────────── */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Environment Variables */}
                {starterData.environmentVariables?.length > 0 && (
                  <div className="bg-white border border-neutral-300 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-600 mb-3">
                      <span>🔒</span>
                      <span>Required Secrets &amp; Environment Variables</span>
                    </div>

                    <div className="space-y-2">
                      {starterData.environmentVariables.map((envVar, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <code className="font-mono font-bold text-orange-600">
                              {envVar.key}
                            </code>
                            {envVar.required && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold">
                                REQUIRED
                              </span>
                            )}
                          </div>
                          <p className="text-neutral-600 text-[11px] mt-1">
                            {envVar.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Setup Instructions */}
                {starterData.setupInstructions?.length > 0 && (
                  <div className="bg-white border border-neutral-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-600 mb-3">
                        <span>⚡</span>
                        <span>Setup &amp; Run Instructions</span>
                      </div>

                      <div className="space-y-2">
                        {starterData.setupInstructions.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-neutral-700 p-2 rounded-lg bg-neutral-50 border border-neutral-200/80"
                          >
                            <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-800 font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="font-medium leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {starterData.nextSteps?.length > 0 && (
                      <p className="text-[11px] font-mono text-neutral-500 mt-3 pt-3 border-t border-neutral-200">
                        💡 Next step: {starterData.nextSteps[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Bottom Guide Integration Footer ───────────────────────── */}
        <div className="bg-white border-t border-neutral-300 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-neutral-900">
              Ready to implement this automation?
            </p>
            <p className="text-[11px] text-neutral-500 font-mono">
              View the complete 6-step testing &amp; deployment blueprint.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
            >
              Close
            </button>

          <a
  href={`/guide?opportunity=${slug}`}
  onClick={onClose}
  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#111] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
>
  <span>Open Step-by-Step Guide</span>
  <span className="text-orange-400">→</span>
</a>
          </div>
        </div>
      </div>
    </div>
  );
}

