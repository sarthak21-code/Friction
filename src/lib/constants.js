// Shared constants and UI helper functions used across multiple pages

export const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "₹ INR", locale: "en-IN", defaultRate: 500 },
  { code: "USD", symbol: "$", label: "$ USD", locale: "en-US", defaultRate: 35 },
  { code: "EUR", symbol: "€", label: "€ EUR", locale: "de-DE", defaultRate: 35 },
  { code: "GBP", symbol: "£", label: "£ GBP", locale: "en-GB", defaultRate: 30 },
];

export const PRESET_WORKFLOWS = [
  {
    label: "Invoice Processing",
    text: "Every morning I receive invoices by email, download each PDF, manually copy the details into Excel, check the totals, and email the spreadsheet to my manager for approval.",
  },
  {
    label: "Customer Onboarding",
    text: "When a new customer signs up, sales sends an email to support, support creates a folder in Google Drive, manually fills in a contract template, sends it for e-signature, and pings Slack when signed.",
  },
  {
    label: "Weekly Reporting",
    text: "Every Friday I pull CSV exports from Stripe, Google Analytics, and HubSpot, copy the numbers into a master Google Sheet, generate charts manually, and paste screenshots into a PowerPoint deck.",
  },
];

// Severity badge for friction points
export function getSeverityBadgeClass(severity) {
  const s = severity?.toLowerCase() || "";
  if (s.includes("critical") || s.includes("high")) {
    return "bg-orange-500/15 text-orange-700 border-orange-500/40";
  }
  if (s.includes("medium")) {
    return "bg-amber-500/15 text-amber-800 border-amber-500/40";
  }
  return "bg-neutral-200 text-neutral-700 border-neutral-300";
}

// Priority badge for automation opportunities
export function getPriorityBadge(priority) {
  const p = priority?.toLowerCase() || "";
  if (p === "now") {
    return {
      pill: "bg-[#111] text-orange-400 border border-orange-500/40 shadow-xs",
      card: "border-2 border-orange-500/70 bg-white shadow-sm ring-1 ring-orange-500/10",
      tag: "⚡ IMMEDIATE ACTION",
    };
  }
  if (p === "next") {
    return {
      pill: "bg-neutral-800 text-neutral-200 border border-neutral-700",
      card: "border border-neutral-300 bg-white shadow-xs",
      tag: "PHASE 2",
    };
  }
  return {
    pill: "bg-neutral-100 text-neutral-600 border border-neutral-200",
    card: "border border-neutral-200 bg-neutral-50/60 shadow-xs",
    tag: "PHASE 3",
  };
}

// Automation type badge for recommended workflow steps
export function getAutomationBadgeClass(automation) {
  const a = automation?.toLowerCase() || "";
  if (a.includes("automated") && !a.includes("partially")) {
    return "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
  }
  if (a.includes("partial")) {
    return "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
  }
  return "bg-neutral-100 text-neutral-700 border-neutral-300 font-medium";
}

// Currency formatter
export function formatCurrencyValue(amount, currCode = "INR") {
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
}
