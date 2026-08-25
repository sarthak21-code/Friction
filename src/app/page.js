"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFriction } from "@/context/FrictionContext";
import { PRESET_WORKFLOWS } from "@/lib/constants";
import WorkflowImageUpload from "@/components/WorkflowImageUpload";

export default function AnalyzePage() {
  const router = useRouter();
  const {
    workflow,
    setWorkflow,
    result,
    loading,
    handleAnalyze,
  } = useFriction();

  const [inputMethod, setInputMethod] = useState("text"); // "text" | "ocr"

  // Voice Dictation State
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle"); // "idle" | "requesting" | "listening" | "transcribing" | "captured" | "error"
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState(null);
  const recognitionRef = useRef(null);
  const capturedTimeoutRef = useRef(null);
  const voiceStatusRef = useRef("idle");

  // This MUST run in an effect, not a lazy initializer: `window` doesn't
  // exist on the server, so checking browser support during the initial
  // render would make the client's first render (mic button shown or not)
  // disagree with the server-rendered HTML on browsers without
  // SpeechRecognition — a hydration mismatch. Running it in an effect keeps
  // the first client render identical to the server, then corrects itself
  // right after — the correct pattern here despite the lint rule.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSpeechSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      voiceStatusRef.current = "idle";
      if (capturedTimeoutRef.current) {
        clearTimeout(capturedTimeoutRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (
      isListening ||
      voiceStatus === "listening" ||
      voiceStatus === "transcribing" ||
      voiceStatus === "requesting"
    ) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      voiceStatusRef.current = "captured";
      setVoiceStatus("captured");
      if (capturedTimeoutRef.current) clearTimeout(capturedTimeoutRef.current);
      capturedTimeoutRef.current = setTimeout(() => {
        voiceStatusRef.current = "idle";
        setVoiceStatus("idle");
      }, 2000);
      setInterimTranscript("");
      return;
    }

    setSpeechError(null);
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError(
        "Voice dictation isn't supported in this browser. You can still type your workflow manually."
      );
      voiceStatusRef.current = "error";
      setVoiceStatus("error");
      setIsListening(false);
      return;
    }

    voiceStatusRef.current = "requesting";
    setVoiceStatus("requesting");

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        voiceStatusRef.current = "listening";
        setVoiceStatus("listening");
      };

      recognition.onresult = (event) => {
        let currentInterim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setWorkflow((prev) =>
              prev ? prev.trim() + " " + transcript.trim() : transcript.trim()
            );
            setInterimTranscript("");
            setIsListening(true);
            voiceStatusRef.current = "listening";
            setVoiceStatus("listening");
          } else {
            currentInterim += transcript;
            setInterimTranscript(currentInterim);
            setIsListening(true);
            voiceStatusRef.current = "transcribing";
            setVoiceStatus("transcribing");
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (
          event.error === "not-allowed" ||
          event.error === "permission-denied"
        ) {
          setSpeechError(
            "Microphone permission was denied. You can still describe your workflow manually."
          );
        } else if (event.error === "no-speech") {
          voiceStatusRef.current = "idle";
          setVoiceStatus("idle");
          setInterimTranscript("");
          return;
        } else {
          setSpeechError(
            "Microphone temporarily unavailable. You can still describe your workflow manually."
          );
        }
        voiceStatusRef.current = "error";
        setVoiceStatus("error");
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
        if (voiceStatusRef.current !== "error") {
          voiceStatusRef.current = "captured";
          setVoiceStatus("captured");
          if (capturedTimeoutRef.current)
            clearTimeout(capturedTimeoutRef.current);
          capturedTimeoutRef.current = setTimeout(() => {
            voiceStatusRef.current = "idle";
            setVoiceStatus("idle");
          }, 2000);
        }
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      setSpeechError(
        "Microphone temporarily unavailable. You can still describe your workflow manually."
      );
      setVoiceStatus("error");
      setInterimTranscript("");
    }
  };

  const isVoiceActive =
    isListening ||
    voiceStatus === "listening" ||
    voiceStatus === "transcribing" ||
    voiceStatus === "requesting";

  const onSubmitWorkflow = async (customText) => {
    const textToAnalyze = typeof customText === "string" ? customText : workflow;
    if (!textToAnalyze || !textToAnalyze.trim()) return;

    if (typeof customText === "string") {
      setWorkflow(customText);
    }

    const data = await handleAnalyze(textToAnalyze);
    if (data && data.analysis) {
      router.push("/diagnostics");
    }
  };

  const hasActiveAnalysis = Boolean(result?.analysis);

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 md:px-10 max-w-4xl mx-auto w-full flex flex-col justify-center">
      {/* ── Active Analysis Notice Banner ────────────────────────────── */}
      {hasActiveAnalysis && (
        <div className="mb-6 p-4 rounded-2xl bg-white border border-neutral-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-neutral-900">
                Active Analysis Ready:{" "}
                <span className="text-orange-600">
                  {result.analysis.top_recommendation?.title || "Workflow Diagnosed"}
                </span>
              </p>
              <p className="text-[11px] font-mono text-neutral-500">
                Score: {result.analysis.friction_score}/100 • Severity: {result.analysis.severity || "High"}
              </p>
            </div>
          </div>

          <Link
            href="/diagnostics"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#111] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition text-center shadow-xs cursor-pointer"
          >
            View Diagnostics →
          </Link>
        </div>
      )}

      {/* ── Hero Heading ─────────────────────────────────────────────── */}
      <section className="text-center sm:text-left mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-mono uppercase tracking-wider text-orange-700 bg-orange-500/10 border border-orange-500/30 rounded-full font-bold">
          <span>✦</span>
          <span>Workflow Intelligence &amp; Inefficiency Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111] leading-[1.15]">
          Understand your workflow.
          <br />
          <span className="text-neutral-500">Find where time is being lost.</span>
        </h1>

        <p className="text-sm text-neutral-600 mt-4 max-w-2xl leading-relaxed">
          {inputMethod === "ocr"
            ? "Upload application screenshots, flowcharts, process diagrams, or whiteboard photos. FRICTION extracts text, maps sequence steps, and pinpoints friction."
            : "Paste any manual routine, dictate with your microphone, or choose a preset. FRICTION diagnoses bottlenecks, calculates ROI, and scaffolds automation."}
        </p>
      </section>

      {/* ── Input Method Switcher Tabs ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-5 bg-neutral-200/80 p-1.5 rounded-2xl border border-neutral-300 w-full sm:w-auto self-start">
        <button
          type="button"
          onClick={() => setInputMethod("text")}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-2 ${
            inputMethod === "text"
              ? "bg-[#111] text-white shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
          }`}
        >
          <span>✍️</span>
          <span>Describe Workflow</span>
        </button>

        <button
          type="button"
          onClick={() => setInputMethod("ocr")}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-2 ${
            inputMethod === "ocr"
              ? "bg-[#111] text-white shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
          }`}
        >
          <span>📷</span>
          <span>Screenshot &amp; Diagram OCR</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-500 text-white font-black">
            AI VISION
          </span>
        </button>
      </div>

      {/* ── OCR Visual Upload Mode ───────────────────────────────────── */}
      {inputMethod === "ocr" && (
        <div className="bg-white border-2 border-neutral-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <WorkflowImageUpload
            onAnalyzeWorkflow={(narrative) => {
              setWorkflow(narrative);
              onSubmitWorkflow(narrative);
            }}
          />
        </div>
      )}

      {/* ── Text & Voice Input Mode ──────────────────────────────────── */}
      {inputMethod === "text" && (
        <div className="bg-white border-2 border-neutral-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Preset Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold">
                Try a realistic example:
              </span>
              <span className="text-[10px] font-mono text-neutral-400">1-click test</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_WORKFLOWS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setWorkflow(preset.text)}
                  className="text-xs font-medium px-3.5 py-2 rounded-xl border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-500 text-neutral-800 transition text-left cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Error Banner */}
          {speechError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
              <span>⚠️ {speechError}</span>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-neutral-500 hover:text-neutral-900 font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Textarea Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="workflow-input" className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Workflow Description
              </label>

              {/* Voice Mic Button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    isVoiceActive
                      ? "bg-red-500 text-white animate-pulse shadow-xs"
                      : voiceStatus === "captured"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300"
                  }`}
                >
                  <span>{isVoiceActive ? "⏹ Stop Dictating" : "🎙 Dictate"}</span>
                  {voiceStatus === "listening" && <span className="text-[10px]">● Listening</span>}
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                id="workflow-input"
                rows={5}
                value={workflow}
                onChange={(e) => setWorkflow(e.target.value)}
                placeholder="Every morning I receive invoices by email, download each PDF, manually copy the details into Excel, check totals, and email the spreadsheet to my manager for approval..."
                className="w-full p-4 rounded-2xl border-2 border-neutral-300 focus:border-neutral-900 focus:ring-0 focus:outline-none text-neutral-900 text-sm leading-relaxed placeholder-neutral-400 bg-neutral-50/60 font-sans transition"
              />

              {interimTranscript && (
                <div className="absolute bottom-3 left-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-xl border border-neutral-200 text-xs text-neutral-500 font-mono italic truncate">
                  🎙 {interimTranscript}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-neutral-400">
              <span>Include who does what, tools used (Excel, Slack, Drive), and approval steps.</span>
              <span>{workflow.length} chars</span>
            </div>
          </div>

          {/* Analysis Error Notification */}
          {result?.error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between gap-3">
              <span>⚠️ {result.error}</span>
              <button
                type="button"
                onClick={() => handleAnalyze(workflow)}
                className="font-bold text-xs underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Submit Action CTA */}
          <div className="pt-2">
            <button
              type="button"
              disabled={loading || !workflow.trim()}
              onClick={() => onSubmitWorkflow(workflow)}
              className="w-full py-4 rounded-2xl bg-[#111] hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-extrabold text-sm uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing workflow...</span>
                </>
              ) : (
                <>
                  <span>Analyze Workflow</span>
                  <span className="text-orange-400 font-bold">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}