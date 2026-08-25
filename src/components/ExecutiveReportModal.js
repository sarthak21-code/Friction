"use client";

import { useState } from "react";
import { generateExecutiveReportHtml } from "@/lib/pdfReportGenerator";
import { formatCurrencyValue } from "@/lib/constants";

export default function ExecutiveReportModal({
  isOpen,
  onClose,
  workflow,
  analysis,
  teamSize = 1,
  timeWastedMinutes = 45,
  hourlyCost = 500,
  currency = "INR",
  annualCost = 0,
  potentialRecoverableCost = 0,
  annualHoursWasted = 0,
}) {
  const [downloading, setDownloading] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen || !analysis) return null;

  const reportParams = {
    workflow,
    analysis,
    teamSize,
    timeWastedMinutes,
    hourlyCost,
    currency,
    annualCost,
    potentialRecoverableCost,
    annualHoursWasted,
  };

const handlePrintPdf = () => {
  setDownloading(true);

  const html = generateExecutiveReportHtml(reportParams);

  // Create a hidden iframe instead of opening a popup.
  // This avoids Chrome's popup blocker completely.
  const iframe = document.createElement("iframe");

  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";

  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;
  const printDocument = iframe.contentDocument;

  if (!printWindow || !printDocument) {
    document.body.removeChild(iframe);
    setDownloading(false);
    alert("Unable to prepare the PDF report. Please try again.");
    return;
  }

  printDocument.open();
  printDocument.write(html);
  printDocument.close();

  const cleanup = () => {
    setDownloading(false);

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 500);
  };

  printWindow.onafterprint = cleanup;

  // Wait for the generated report to finish rendering.
  setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("FRICTION print error:", error);
      cleanup();
      alert("Unable to open the print dialog. Please try again.");
    }
  }, 500);
};

  const handleDownloadHtmlFile = () => {
    setDownloading(true);
    const htmlContent = generateExecutiveReportHtml(reportParams);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (analysis?.top_recommendation?.title || "workflow_report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
    link.href = url;
    link.download = `friction_executive_report_${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  const handleCopySummary = () => {
    const summaryText = `FRICTION EXECUTIVE AUDIT REPORT
Title: ${analysis.top_recommendation?.title || "Workflow Optimization"}
Friction Score: ${analysis.friction_score}/100 (${analysis.severity || "High"})
Estimated Waste: ~${timeWastedMinutes} min/day across ${teamSize} person(s)
Potential Annual Overhead: ${formatCurrencyValue(annualCost, currency)}
Potential Recoverable Value: ${formatCurrencyValue(potentialRecoverableCost, currency)}

Top Recommendation:
${analysis.top_recommendation?.title}: ${analysis.top_recommendation?.reason || ""}
Expected Impact: ${analysis.top_recommendation?.expected_impact || ""}`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#f5f4f0] rounded-3xl border-2 border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* ── 1. Top Header Bar ──────────────────────────────────────── */}
        <div className="bg-[#111] text-white px-6 py-4 flex items-center justify-between border-b border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Executive Audit Report
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                Ready for stakeholder presentation &amp; PDF export
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

        {/* ── 2. Report Document Preview ─────────────────────────────── */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Executive Document Paper Container */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-neutral-300 shadow-sm space-y-6">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b-2 border-neutral-900">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="font-black text-lg text-neutral-900 tracking-tight">
                  FRICTION
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-neutral-100 px-2.5 py-1 rounded border border-neutral-300 text-neutral-700">
                EXECUTIVE AUDIT REPORT • CONFIDENTIAL
              </span>
            </div>

            {/* Title & Date */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                {analysis.top_recommendation?.title || "Workflow Efficiency & Friction Diagnosis"}
              </h2>
              <p className="text-xs font-mono text-neutral-500 mt-1">
                Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} • FRICTION AI Diagnostic Engine
              </p>
            </div>

            {/* Score & Severity Card */}
            <div className="bg-[#111] text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
                  DIAGNOSTIC SCORE &amp; SEVERITY
                </p>
                <p className="text-lg font-bold text-white mt-0.5">
                  Severity: <span className="text-orange-400">{analysis.severity || "High"}</span>
                </p>
                <p className="text-xs text-neutral-300 mt-1 max-w-md">
                  {analysis.summary}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-4xl sm:text-5xl font-black text-orange-500">
                  {analysis.friction_score ?? 65}
                </span>
                <span className="text-xs font-mono text-neutral-400 block">/ 100 FRICTION INDEX</span>
              </div>
            </div>

            {/* Key Impact Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <p className="text-[10px] font-mono uppercase text-neutral-500 font-bold">Annual Inefficiency</p>
                <p className="text-xl font-bold font-mono text-red-600 mt-0.5">
                  {formatCurrencyValue(annualCost, currency)}
                </p>
                <p className="text-[10px] text-neutral-500">~{annualHoursWasted} hrs lost / yr</p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-[10px] font-mono uppercase text-emerald-800 font-bold">Recoverable Value</p>
                <p className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
                  +{formatCurrencyValue(potentialRecoverableCost, currency)}
                </p>
                <p className="text-[10px] text-emerald-700">At 75% target automation</p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <p className="text-[10px] font-mono uppercase text-neutral-500 font-bold">Time Waste</p>
                <p className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
                  ~{timeWastedMinutes} min/day
                </p>
                <p className="text-[10px] text-neutral-500">{teamSize} team member(s)</p>
              </div>
            </div>

            {/* Friction Points Identified */}
            <div className="space-y-2">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 border-b pb-1">
                Friction Bottlenecks Identified
              </p>
              <div className="space-y-2">
                {analysis.friction_points?.slice(0, 3).map((pt, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                    <p className="font-bold text-neutral-900">
                      {idx + 1}. {pt.step}
                    </p>
                    <p className="text-neutral-600 mt-0.5">
                      <strong>Problem:</strong> {pt.problem}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Recommendation & Transformation */}
            {analysis.top_recommendation && (
              <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200 space-y-1.5 text-xs">
                <p className="font-mono font-bold uppercase text-orange-800 text-[10px]">
                  TOP RECOMMENDATION &amp; BLUEPRINT
                </p>
                <p className="font-bold text-neutral-900 text-sm">
                  {analysis.top_recommendation.title}
                </p>
                <p className="text-neutral-700">
                  {analysis.top_recommendation.reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Bottom Actions & Export Toolbar ──────────────────────── */}
        <div className="bg-white border-t border-neutral-300 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-neutral-900">
              Export Official Executive Report
            </p>
            <p className="text-[11px] text-neutral-500 font-mono">
              Save as PDF for stakeholders, investors, or leadership review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
            >
              {copiedSummary ? "✓ Copied" : "📋 Copy Summary"}
            </button>

            <button
              type="button"
              onClick={handleDownloadHtmlFile}
              className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
            >
              ⬇ HTML File
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={downloading}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
            >
              {downloading ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-white animate-spin" />
                  <span>Preparing Report...</span>
                </>
              ) : (
                <>
                  <span>📄 Print / Save as PDF</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
