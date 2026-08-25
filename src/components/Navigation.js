"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useFriction } from "@/context/FrictionContext";

const NAV_ITEMS = [
  { href: "/", label: "Analyze", exact: true },
  { href: "/diagnostics", label: "Diagnostics" },
  { href: "/automate", label: "Automate" },
  { href: "/simulation", label: "Simulation" },
  { href: "/ask", label: "Ask FRICTION" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { result, handleReset } = useFriction();
  const hasAnalysis = Boolean(result?.analysis);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const handleNewAnalysis = () => {
    handleReset();
    router.push("/");
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-300 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
        <div className="flex items-center justify-between h-16">
          {/* ── Brand Logo ────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0 group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-3 h-3 rounded-full bg-orange-500 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-[#111] leading-none">
                FRICTION
              </span>
              <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest leading-tight mt-0.5 hidden sm:inline">
                Workflow Intelligence
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav Links ─────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1.5 ml-8">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-[#111] text-white shadow-xs"
                      : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
                  }`}
                >
                  {item.label === "Analyze" && <span>✍️</span>}
                  {item.label === "Diagnostics" && <span>📊</span>}
                  {item.label === "Automate" && <span>⚡</span>}
                  {item.label === "Simulation" && <span>🔮</span>}
                  {item.label === "Ask FRICTION" && <span>💬</span>}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Right: Status & Quick Reset ──────────────────────── */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            {hasAnalysis ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-emerald-50 border border-emerald-300 rounded-full text-emerald-800 font-bold whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ANALYSIS ACTIVE
                </span>
                <button
                  type="button"
                  onClick={handleNewAnalysis}
                  className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-300 hover:border-neutral-500 bg-neutral-50 transition cursor-pointer whitespace-nowrap"
                  title="Clear current analysis and start fresh"
                >
                  ← New Analysis
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-neutral-100 border border-neutral-300 rounded-full text-neutral-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                READY
              </span>
            )}
          </div>

          {/* ── Mobile Hamburger Button ───────────────────────────── */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-neutral-100 text-neutral-700 transition cursor-pointer border border-neutral-300"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu Dropdown ──────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition ${
                    active
                      ? "bg-[#111] text-white shadow-xs"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.label === "Analyze" && <span>✍️</span>}
                    {item.label === "Diagnostics" && <span>📊</span>}
                    {item.label === "Automate" && <span>⚡</span>}
                    {item.label === "Simulation" && <span>🔮</span>}
                    {item.label === "Ask FRICTION" && <span>💬</span>}
                    <span>{item.label}</span>
                  </div>
                  {active && <span className="text-orange-400 font-bold">●</span>}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-200 flex flex-col gap-2">
            {hasAnalysis ? (
              <>
                <div className="flex items-center justify-between px-3 py-1 text-xs font-mono text-emerald-800 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Analysis Active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNewAnalysis}
                  className="w-full text-center px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 transition cursor-pointer"
                >
                  ← Start New Analysis
                </button>
              </>
            ) : (
              <p className="text-[11px] font-mono text-neutral-400 text-center px-3 py-1">
                Enter a workflow to begin diagnosis.
              </p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
