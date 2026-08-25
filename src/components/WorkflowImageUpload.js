"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SAMPLE_WORKFLOW_DIAGRAMS } from "@/lib/diagramPresets";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/svg",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function WorkflowImageUpload({ onAnalyzeWorkflow, isAnalyzing }) {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0); // 0: Reading, 1: Mapping, 2: Finding friction
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [editableNarrative, setEditableNarrative] = useState("");
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [copiedRawText, setCopiedRawText] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fileInputRef = useRef(null);
  const stageTimerRef = useRef(null);

  // Cycle loading stages smoothly.
  // This resets/advances local UI state on a timer while `loading` is true —
  // a legitimate external-timer synchronization, not a derivable render value,
  // so the setState-in-effect rule is intentionally suppressed here.
  useEffect(() => {
    if (loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingStage(0);
      const stage1 = setTimeout(() => setLoadingStage(1), 2200);
      const stage2 = setTimeout(() => setLoadingStage(2), 4800);
      return () => {
        clearTimeout(stage1);
        clearTimeout(stage2);
      };
    } else {
      setLoadingStage(0);
    }
  }, [loading]);

  const executeOcrExtraction = useCallback(async (dataUrl, mimeType, name) => {
    setLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          mimeType,
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process and extract workflow from image.");
      }

      setExtractedData(data.extracted);
      setEditableNarrative(data.extracted.workflow_narrative || "");
    } catch (err) {
      console.error("OCR Extraction failed:", err);
      setError(
        err.message || "Failed to extract workflow from the image. Please verify the image is clear and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProcessFile = useCallback((file) => {
    setError(null);
    setExtractedData(null);

    // 1. Validate file type
    const fileType = file.type?.toLowerCase() || "";
    const isAllowed = ALLOWED_MIME_TYPES.some((type) => fileType.includes(type.replace("image/", "")));
    if (!isAllowed && !fileType.startsWith("image/")) {
      setError("Unsupported file format. Please upload a PNG, JPG, or WEBP image.");
      return;
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`Image file is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    if (file.size === 0) {
      setError("The uploaded image file is empty or corrupted.");
      return;
    }

    setImageName(file.name || "Pasted screenshot");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target.result;
      setImagePreview(base64Url);
      executeOcrExtraction(base64Url, file.type || "image/png", file.name || "workflow_image");
    };
    reader.onerror = () => {
      setError("Failed to read image file from disk. Please try again.");
    };
    reader.readAsDataURL(file);
  }, [executeOcrExtraction]);

  // Global paste handler (Ctrl+V / Cmd+V anywhere on window)
  useEffect(() => {
    const handlePaste = (e) => {
      // Don't intercept if user is typing in a textarea or input
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "textarea" || activeTag === "input") return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleProcessFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleProcessFile]);

  const handleSampleSelect = (sample) => {
    setError(null);
    setImageName(sample.title);
    setImagePreview(sample.dataUrl);
    executeOcrExtraction(sample.dataUrl, "image/svg+xml", sample.id);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageName("");
    setExtractedData(null);
    setError(null);
    setEditableNarrative("");
    setIsEditingNarrative(false);
    setShowRawText(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTriggerAnalysis = () => {
    const narrativeToAnalyze = editableNarrative.trim() || extractedData?.workflow_narrative || "";
    if (!narrativeToAnalyze) {
      setError("Workflow narrative is empty. Please enter or extract steps before analyzing.");
      return;
    }
    if (onAnalyzeWorkflow) {
      onAnalyzeWorkflow(narrativeToAnalyze);
    }
  };

  const handleCopyRawText = () => {
    if (!extractedData?.raw_text) return;
    navigator.clipboard.writeText(extractedData.raw_text);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  const getStepTypeBadge = (type, isManual, isBottleneck) => {
    if (isBottleneck) {
      return "bg-red-50 text-red-700 border-red-300 font-bold";
    }
    const t = type?.toLowerCase() || "";
    if (t.includes("decision")) {
      return "bg-purple-50 text-purple-700 border-purple-300 font-semibold";
    }
    if (t.includes("handoff")) {
      return "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
    }
    if (t.includes("waiting")) {
      return "bg-orange-50 text-orange-800 border-orange-300 font-semibold";
    }
    if (isManual) {
      return "bg-neutral-100 text-neutral-800 border-neutral-300 font-medium";
    }
    return "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
  };

  return (
    <div className="w-full">
      {/* ── 1. Upload & Dropzone Area (when no data extracted and not loading) ───────────────── */}
      {!extractedData && !loading && (
        <div className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? "border-orange-500 bg-orange-500/10 ring-4 ring-orange-500/20 scale-[0.99]"
                : "border-neutral-300 hover:border-neutral-800 bg-white hover:bg-neutral-50/70 shadow-xs"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.svg"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-2xl group-hover:scale-105 transition">
                <span>📷</span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                  Upload a workflow screenshot or diagram
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-md mx-auto leading-relaxed">
                  Drop an image, browse files, or press{" "}
                  <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-neutral-100 border border-neutral-300 rounded font-semibold text-neutral-800">
                    Ctrl + V
                  </kbd>{" "}
                  to paste a screenshot directly.
                </p>
              </div>

              {/* Supported format pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                {["PNG", "JPG", "WEBP", "Flowcharts", "Process Maps", "Whiteboards", "App Screens"].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#111] hover:bg-neutral-800 text-white font-semibold text-xs uppercase tracking-wider transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Select Image File</span>
                  <span className="text-orange-400">↑</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Preset Samples for 1-click test */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                Or test with a sample diagram:
              </p>
              <span className="text-[10px] font-mono text-neutral-400">1-Click OCR Demo</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-2.5">
              {SAMPLE_WORKFLOW_DIAGRAMS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSampleSelect(sample)}
                  className="text-left p-3 rounded-xl bg-white hover:bg-neutral-100/80 border border-neutral-200 hover:border-neutral-400 transition cursor-pointer shadow-2xs group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                        {sample.badge}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 group-hover:text-neutral-900 transition">
                        Load →
                      </span>
                    </div>
                    <p className="text-xs font-bold text-neutral-900 leading-snug">
                      {sample.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                      {sample.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Loading State: Multi-Stage Processing Animation ───────────────── */}
      {loading && (
        <div className="bg-white border-2 border-neutral-300 rounded-2xl p-8 sm:p-10 text-center shadow-sm space-y-6">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xl">
              {loadingStage === 0 ? "🔍" : loadingStage === 1 ? "🗺️" : "⚡"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono uppercase tracking-wider text-orange-700 bg-orange-500/10 border border-orange-500/30 rounded-full font-bold">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <span>VISUAL WORKFLOW RECOGNITION</span>
            </div>

            <h3 className="text-2xl font-black tracking-tight text-[#111]">
              {loadingStage === 0 && "Reading workflow..."}
              {loadingStage === 1 && "Mapping steps..."}
              {loadingStage >= 2 && "Finding friction..."}
            </h3>

            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
              {loadingStage === 0 && "Scanning text nodes, swimlanes, tool labels, and annotations."}
              {loadingStage === 1 && "Connecting sequential actions, decision branches, and team handoffs."}
              {loadingStage >= 2 && "Detecting manual copy-paste bottlenecks, waiting buffers, and tool switches."}
            </p>
          </div>

          {/* Stepper indicators */}
          <div className="max-w-xs mx-auto flex items-center justify-between text-[11px] font-mono pt-2">
            <div className={`flex items-center gap-1.5 ${loadingStage >= 0 ? "text-orange-600 font-bold" : "text-neutral-400"}`}>
              <span className={`w-2 h-2 rounded-full ${loadingStage >= 0 ? "bg-orange-500" : "bg-neutral-300"}`} />
              <span>1. Read</span>
            </div>
            <span className="text-neutral-300">──</span>
            <div className={`flex items-center gap-1.5 ${loadingStage >= 1 ? "text-orange-600 font-bold" : "text-neutral-400"}`}>
              <span className={`w-2 h-2 rounded-full ${loadingStage >= 1 ? "bg-orange-500" : "bg-neutral-300"}`} />
              <span>2. Map</span>
            </div>
            <span className="text-neutral-300">──</span>
            <div className={`flex items-center gap-1.5 ${loadingStage >= 2 ? "text-orange-600 font-bold" : "text-neutral-400"}`}>
              <span className={`w-2 h-2 rounded-full ${loadingStage >= 2 ? "bg-orange-500" : "bg-neutral-300"}`} />
              <span>3. Friction</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Error Notification ───────────────────────────────────────────── */}
      {error && !loading && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold text-red-900">OCR Extraction Error</p>
              <p className="text-red-700 mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-900 font-bold text-xs hover:underline cursor-pointer px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 4. Extracted Workflow View ──────────────────────────────────────── */}
      {extractedData && !loading && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Bar */}
          <div className="bg-white border-2 border-neutral-300 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-neutral-200">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    EXTRACTED WORKFLOW
                  </span>
                  <span className="text-xs font-mono text-neutral-500 px-2 py-0.5 bg-neutral-100 rounded-md border border-neutral-200">
                    {extractedData.diagram_type || "Diagram"}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111] pt-1">
                  {extractedData.title || "Visual Process Workflow"}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed pt-1">
                  {extractedData.summary}
                </p>
              </div>

              {/* Upload another image button */}
              <button
                type="button"
                onClick={handleReset}
                className="self-start sm:self-auto text-xs font-mono font-semibold uppercase tracking-wider border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 px-3 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <span>📷</span>
                <span>Upload Another</span>
              </button>
            </div>

            {/* Thumbnail Preview & Quick Stats */}
            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    title="Click to view full image"
                    className="relative group w-16 h-12 rounded-lg border border-neutral-300 overflow-hidden bg-neutral-100 flex-shrink-0 cursor-pointer shadow-2xs hover:ring-2 hover:ring-orange-500 transition"
                  >
                    {/* next/image is skipped here on purpose: this is a locally
                        generated base64 data URL of an uploaded file, not a
                        network asset, so there's nothing for the image
                        optimizer to fetch or cache. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt={imageName || "Workflow screenshot"}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-0 bg-black/40 text-white text-[9px] font-mono flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      Zoom
                    </span>
                  </button>
                )}

                <div>
                  <p className="text-xs font-bold text-neutral-800 truncate max-w-xs sm:max-w-sm">
                    {imageName || "Visual workflow image"}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-500">
                    {extractedData.steps?.length || 0} Steps Detected • {extractedData.tools_detected?.length || 0} Tools
                  </p>
                </div>
              </div>

              {/* Primary Analyze Action in Header */}
              <button
                type="button"
                onClick={handleTriggerAnalysis}
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#111] hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Analyzing Friction...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze this workflow</span>
                    <span className="text-orange-400 font-bold">→</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Detected Steps Sequence ────────────────────────────────────────── */}
          <div className="bg-white border border-neutral-300 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                  SEQUENCE MAPPING
                </p>
                <h4 className="text-lg font-bold text-[#111]">
                  Detected Workflow Steps
                </h4>
              </div>
              <span className="text-xs font-mono text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                {extractedData.steps?.length || 0} Steps
              </span>
            </div>

            <div className="space-y-3">
              {extractedData.steps?.map((step, idx) => {
                const badgeClass = getStepTypeBadge(step.type, step.is_manual, step.is_bottleneck);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition ${
                      step.is_bottleneck
                        ? "border-red-300 bg-red-50/20 border-l-4 border-l-red-500"
                        : step.is_manual
                        ? "border-neutral-200 bg-neutral-50/60 border-l-4 border-l-neutral-400"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#111] text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {step.step_number || idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 leading-snug">
                            {step.action}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-neutral-500">
                            {step.actor && (
                              <span className="font-mono bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                                👤 {step.actor}
                              </span>
                            )}
                            {step.tool && (
                              <span className="font-mono bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                                🛠️ {step.tool}
                              </span>
                            )}
                            {step.notes && (
                              <span className="text-neutral-600 italic">
                                &ldquo;{step.notes}&rdquo;
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                          {step.is_bottleneck ? "⚠️ Bottleneck" : step.type || (step.is_manual ? "Manual" : "Action")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── What FRICTION Found (Friction Category Highlights) ──────────────── */}
          <div className="bg-white border border-neutral-300 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                PRE-ANALYSIS DIAGNOSTIC
              </p>
              <h4 className="text-lg font-bold text-[#111]">
                What FRICTION Found in this Visual
              </h4>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Manual Work */}
              {extractedData.friction_highlights?.manual_work?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-orange-50/40 border border-orange-200">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-orange-800 uppercase tracking-wider mb-1">
                    <span>🖐️</span>
                    <span>Manual Work</span>
                  </div>
                  <ul className="text-xs text-neutral-700 space-y-1 pl-4 list-disc">
                    {extractedData.friction_highlights.manual_work.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Repetitive Work */}
              {extractedData.friction_highlights?.repetitive_tasks?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1">
                    <span>🔁</span>
                    <span>Repetitive Loops</span>
                  </div>
                  <ul className="text-xs text-neutral-700 space-y-1 pl-4 list-disc">
                    {extractedData.friction_highlights.repetitive_tasks.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Waiting & Delays */}
              {extractedData.friction_highlights?.waiting_points?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-900 uppercase tracking-wider mb-1">
                    <span>⏳</span>
                    <span>Waiting Points</span>
                  </div>
                  <ul className="text-xs text-neutral-700 space-y-1 pl-4 list-disc">
                    {extractedData.friction_highlights.waiting_points.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Context Switching */}
              {extractedData.friction_highlights?.context_switching?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1">
                    <span>🔀</span>
                    <span>Context Switching</span>
                  </div>
                  <ul className="text-xs text-neutral-700 space-y-1 pl-4 list-disc">
                    {extractedData.friction_highlights.context_switching.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Duplicate Entry */}
              {extractedData.friction_highlights?.duplicate_data_entry?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1">
                    <span>📋</span>
                    <span>Duplicate Entry</span>
                  </div>
                  <ul className="text-xs text-neutral-700 space-y-1 pl-4 list-disc">
                    {extractedData.friction_highlights.duplicate_data_entry.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Handoffs */}
              {extractedData.friction_highlights?.handoffs?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1">
                    <span>🤝</span>
                    <span>Team Handoffs</span>
                  </div>
                  <ul className="text-xs text-neutral-700 space-y-1 pl-4 list-disc">
                    {extractedData.friction_highlights.handoffs.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Detected Tools Chips */}
            {extractedData.tools_detected?.length > 0 && (
              <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-neutral-500 uppercase font-semibold">
                  Detected Tools & Systems:
                </span>
                {extractedData.tools_detected.map((tool, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-neutral-100 text-neutral-900 border border-neutral-300"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Workflow Narrative (Ready for Analysis) ────────────────────────── */}
          <div className="bg-[#111] text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                  STRUCTURED NARRATIVE
                </p>
                <h4 className="text-base font-bold text-white mt-0.5">
                  Workflow Ready for FRICTION Analysis
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingNarrative(!isEditingNarrative)}
                className="text-xs font-mono text-neutral-400 hover:text-white underline cursor-pointer"
              >
                {isEditingNarrative ? "Done Editing" : "✎ Edit Narrative"}
              </button>
            </div>

            {isEditingNarrative ? (
              <textarea
                value={editableNarrative}
                onChange={(e) => setEditableNarrative(e.target.value)}
                rows={5}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-700 p-3 text-sm text-neutral-100 font-sans leading-relaxed focus:border-orange-500 focus:outline-none"
              />
            ) : (
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 text-xs sm:text-sm leading-relaxed">
                {editableNarrative || extractedData.workflow_narrative}
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {extractedData.raw_text && (
                  <button
                    type="button"
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-xs font-mono text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
                  >
                    {showRawText ? "▲ Hide Raw OCR Text" : "▼ View Raw OCR Text"}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleTriggerAnalysis}
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Analyzing Bottlenecks & ROI...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze this workflow</span>
                    <span className="text-white font-bold">→</span>
                  </>
                )}
              </button>
            </div>

            {/* Collapsible Raw Text Viewer */}
            {showRawText && extractedData.raw_text && (
              <div className="mt-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>RAW OCR TEXT EXTRACTED:</span>
                  <button
                    type="button"
                    onClick={handleCopyRawText}
                    className="text-orange-400 hover:underline cursor-pointer"
                  >
                    {copiedRawText ? "✓ Copied" : "📋 Copy"}
                  </button>
                </div>
                <pre className="text-xs font-mono text-neutral-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {extractedData.raw_text}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lightbox Modal for Image Preview ───────────────────────────────── */}
      {lightboxOpen && imagePreview && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 cursor-default"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
              <span className="text-xs font-mono font-bold text-neutral-700">
                {imageName || "Workflow Image"}
              </span>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="text-neutral-500 hover:text-black font-bold text-sm px-2 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh]">
              {/* Same rationale as the thumbnail above: local data URL, not a
                  network image, and needs its natural aspect ratio (h-auto)
                  which next/image can't give without a known width/height. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Workflow full preview"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
