// Zero-dependency Client-side Executive PDF Report Builder & HTML Print Generator
import { formatCurrencyValue } from "./constants";

export function generateExecutiveReportHtml({
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
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const title =
    analysis?.top_recommendation?.title ||
    "Workflow Efficiency & Operational Friction Report";

  const score = analysis?.friction_score ?? 65;
  const severity = analysis?.severity || "High";
  const summary =
    analysis?.summary ||
    "Operational workflow exhibiting manual friction, repetitive handoffs, and automation potential.";

  const frictionPoints = analysis?.friction_points || [];
  const opportunities = analysis?.automation_opportunities || [];
  const beforeSteps = analysis?.before_after?.before || [];
  const afterSteps = analysis?.before_after?.after || [];
  const recommendedSteps = analysis?.recommended_workflow || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FRICTION Executive Report — ${title}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111111;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11pt;
    }
    .page {
      page-break-after: always;
      position: relative;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #111;
      padding-bottom: 8px;
      margin-bottom: 20px;
    }
    .logo {
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .logo-dot {
      width: 10px;
      height: 10px;
      background: #ea580c;
      border-radius: 50%;
      display: inline-block;
    }
    .report-badge {
      font-family: monospace;
      font-size: 8pt;
      font-weight: 700;
      background: #f5f4f0;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .hero-title {
      font-size: 22pt;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 8px;
      color: #111;
    }
    .hero-meta {
      font-family: monospace;
      font-size: 9pt;
      color: #666;
      margin-bottom: 24px;
    }
    .section {
      margin-bottom: 22px;
    }
    .section-title {
      font-size: 12pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 4px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .score-card {
      background: #111;
      color: #fff;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .score-val {
      font-size: 38pt;
      font-weight: 900;
      color: #ea580c;
      line-height: 1;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .metric-box {
      background: #f9f9f7;
      border: 1px solid #e5e5e0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .metric-lbl {
      font-family: monospace;
      font-size: 7.5pt;
      text-transform: uppercase;
      color: #666;
      font-weight: 700;
    }
    .metric-val {
      font-size: 14pt;
      font-weight: 800;
      margin-top: 2px;
      color: #111;
    }
    .card {
      background: #fafaf8;
      border: 1px solid #e2e2de;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 8px;
    }
    .card-critical {
      border-left: 4px solid #ea580c;
      background: #fff9f5;
    }
    .tag {
      font-family: monospace;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #eee;
      display: inline-block;
    }
    .tag-orange {
      background: #ffedd5;
      color: #c2410c;
    }
    .tag-green {
      background: #dcfce7;
      color: #15803d;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .step-list {
      list-style: none;
      counter-reset: item;
    }
    .step-item {
      counter-increment: item;
      margin-bottom: 6px;
      padding-left: 24px;
      position: relative;
      font-size: 9.5pt;
    }
    .step-item::before {
      content: counter(item);
      position: absolute;
      left: 0;
      top: 0;
      width: 18px;
      height: 18px;
      background: #111;
      color: #fff;
      border-radius: 50%;
      font-size: 7pt;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 18px;
    }
    .disclaimer {
      font-size: 7.5pt;
      color: #777;
      border-top: 1px solid #eee;
      padding-top: 10px;
      margin-top: 24px;
      line-height: 1.4;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- ── PAGE 1: EXECUTIVE SUMMARY & DIAGNOSTICS ──────────────────────────── -->
  <div class="page">
    <div class="header">
      <div class="logo">
        <span class="logo-dot"></span>
        <span>FRICTION</span>
      </div>
      <span class="report-badge">EXECUTIVE AUDIT REPORT • CONFIDENTIAL</span>
    </div>

    <h1 class="hero-title">${title}</h1>
    <div class="hero-meta">
      DATE GENERATED: ${dateStr.toUpperCase()} • EVALUATION: AI DIAGNOSTIC ENGINE v2.4
    </div>

    <!-- Friction Score Hero Card -->
    <div class="score-card">
      <div>
        <div style="font-family: monospace; font-size: 9pt; color: #a3a3a3; text-transform: uppercase;">
          DIAGNOSTIC FRICTION INDEX
        </div>
        <div style="font-size: 13pt; font-weight: 700; margin-top: 4px;">
          Severity: <span style="color: #fb923c;">${severity.toUpperCase()}</span>
        </div>
        <p style="font-size: 9pt; color: #d4d4d4; margin-top: 4px; max-width: 380px;">
          ${summary}
        </p>
      </div>
      <div style="text-align: right;">
        <div class="score-val">${score}</div>
        <div style="font-family: monospace; font-size: 8pt; color: #a3a3a3;">OUT OF 100</div>
      </div>
    </div>

    <!-- Financial & Latency Impact Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-lbl">Potential Annual Overhead</div>
        <div class="metric-val" style="color: #dc2626;">${formatCurrencyValue(annualCost, currency)}</div>
        <div style="font-size: 8pt; color: #666; margin-top: 2px;">~${annualHoursWasted} hrs/year wasted</div>
      </div>

      <div class="metric-box">
        <div class="metric-lbl">Potential Recoverable Value</div>
        <div class="metric-val" style="color: #16a34a;">+${formatCurrencyValue(potentialRecoverableCost, currency)}</div>
        <div style="font-size: 8pt; color: #666; margin-top: 2px;">at 75% target automation</div>
      </div>

      <div class="metric-box">
        <div class="metric-lbl">Assessed Latency</div>
        <div class="metric-val">~${timeWastedMinutes} min/day</div>
        <div style="font-size: 8pt; color: #666; margin-top: 2px;">Across ${teamSize} team member(s)</div>
      </div>
    </div>

    <!-- Top Friction Points Detected -->
    <div class="section">
      <div class="section-title">Critical Friction Points Identified</div>
      ${
        frictionPoints.length > 0
          ? frictionPoints
              .slice(0, 4)
              .map(
                (fp, i) => `
        <div class="card ${i === 0 ? "card-critical" : ""}">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
            <strong style="font-size: 10pt; color: #111;">${fp.step || `Bottleneck #${i + 1}`}</strong>
            <span class="tag ${i === 0 ? "tag-orange" : ""}">${fp.severity || "MEDIUM"}</span>
          </div>
          <p style="font-size: 9pt; color: #444; margin-top: 2px;"><strong>Problem:</strong> ${fp.problem || ""}</p>
          ${fp.impact ? `<p style="font-size: 8.5pt; color: #666; margin-top: 2px;"><strong>Impact:</strong> ${fp.impact}</p>` : ""}
        </div>
      `
              )
              .join("")
          : `<p style="font-size: 9pt; color: #666;">No individual friction bottlenecks provided.</p>`
      }
    </div>

    <!-- Original Workflow Description -->
    <div class="section">
      <div class="section-title">Original Workflow Process</div>
      <div class="card" style="font-size: 9pt; color: #333; line-height: 1.5; font-style: italic;">
        &ldquo;${workflow || "Workflow analysis narrative."}&rdquo;
      </div>
    </div>
  </div>

  <!-- ── PAGE 2: TRANSFORMATION & ROADMAP ────────────────────────────────── -->
  <div class="page" style="padding-top: 10px;">
    <div class="header">
      <div class="logo">
        <span class="logo-dot"></span>
        <span>FRICTION</span>
      </div>
      <span class="report-badge">RECOMMENDED BLUEPRINT &amp; ROADMAP</span>
    </div>

    <!-- Top Automation Opportunities -->
    <div class="section">
      <div class="section-title">Priority Automation Opportunities</div>
      ${
        opportunities.length > 0
          ? opportunities
              .slice(0, 3)
              .map(
                (opp, i) => `
        <div class="card" style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px;">
            <strong style="font-size: 10.5pt; color: #111;">${i + 1}. ${opp.task}</strong>
            <span class="tag ${opp.priority?.toLowerCase() === "now" ? "tag-orange" : "tag-green"}">
              ${opp.priority ? `PRIORITY: ${opp.priority.toUpperCase()}` : "AUTOMATE"}
            </span>
          </div>
          <p style="font-size: 9pt; color: #333; margin-top: 2px;"><strong>Approach:</strong> ${opp.suggestion || ""}</p>
          <p style="font-size: 8.5pt; color: #16a34a; font-weight: 600; margin-top: 2px;">✓ Benefit: ${opp.benefit || ""}</p>
          ${
            opp.tools?.length > 0
              ? `<div style="margin-top: 4px;"><span style="font-size: 8pt; font-family: monospace; color: #666;">STACK: ${opp.tools.join(", ")}</span></div>`
              : ""
          }
        </div>
      `
              )
              .join("")
          : `<p style="font-size: 9pt; color: #666;">No specific opportunity records available.</p>`
      }
    </div>

    <!-- Before vs After Transformation Grid -->
    <div class="section">
      <div class="section-title">Process Transformation: Before vs. Streamlined After</div>
      <div class="grid-2">
        <div class="card" style="background: #fafafa;">
          <div style="font-weight: 800; font-size: 9pt; text-transform: uppercase; color: #777; margin-bottom: 6px;">
            Current Manual Flow
          </div>
          <ul class="step-list">
            ${
              beforeSteps.length > 0
                ? beforeSteps.map((s) => `<li class="step-item">${s}</li>`).join("")
                : `<li class="step-item">Manual data transcription</li><li class="step-item">Email handoffs</li>`
            }
          </ul>
        </div>

        <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
          <div style="font-weight: 800; font-size: 9pt; text-transform: uppercase; color: #15803d; margin-bottom: 6px;">
            Recommended Automated Flow
          </div>
          <ul class="step-list">
            ${
              afterSteps.length > 0
                ? afterSteps.map((s) => `<li class="step-item" style="color: #14532d; font-weight: 500;">${s}</li>`).join("")
                : recommendedSteps.length > 0
                ? recommendedSteps.map((s) => `<li class="step-item" style="color: #14532d; font-weight: 500;">${s.action}</li>`).join("")
                : `<li class="step-item">Automated webhook trigger</li><li class="step-item">Instant database sync</li>`
            }
          </ul>
        </div>
      </div>
    </div>

    <!-- Implementation Blueprint Reference -->
    <div class="section">
      <div class="section-title">Implementation Blueprint &amp; Code Scaffolding</div>
      <div class="card" style="background: #111; color: #fff;">
        <strong style="font-size: 10pt; color: #fb923c;">1-Click Starter Code &amp; Interactive Guide Ready</strong>
        <p style="font-size: 8.5pt; color: #ccc; margin-top: 4px;">
          This analysis includes an interactive 6-step testing and deployment checklist, live Ask FRICTION engineering copilot, and runnable starter code templates in Python and Node.js.
        </p>
      </div>
    </div>

    <!-- AI Disclaimer -->
    <div class="disclaimer">
      <strong>AI Diagnostic Notice:</strong> This report is synthesized by the FRICTION AI Workflow Intelligence Engine based on user-provided operational inputs. Projections and time-saving estimates represent statistical approximations and are not guaranteed contractual outcomes. Review and test in staging before deploying to live business infrastructure.
      <br>© ${new Date().getFullYear()} FRICTION Intelligence. All rights reserved.
    </div>
  </div>

</body>
</html>`;
}

export function printExecutiveReport(params) {
  const html = generateExecutiveReportHtml(params);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Pop-up blocked. Please allow pop-ups to view and print the Executive Report.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
