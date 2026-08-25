// Preset sample workflow diagrams with generated SVG Data URLs for quick testing

function createSvgDataUrl(svgString) {
  const clean = svgString.replace(/\n\s*/g, " ").trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
}

export const SAMPLE_WORKFLOW_DIAGRAMS = [
  {
    id: "invoice-processing",
    title: "Invoice Approval Flowchart",
    subtitle: "Finance & Accounts Payable",
    description: "Flowchart showing email PDF reception, manual Excel data entry, approval gating, and accounting sync.",
    badge: "Flowchart",
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="900" height="480" style="background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace, sans-serif;">
        <defs>
          <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#111111"/>
            <stop offset="100%" stop-color="#2a2a2a"/>
          </linearGradient>
          <filter id="shadow" x="-4%" y="-4%" width="108%" height="112%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08"/>
          </filter>
        </defs>

        <!-- Diagram Background -->
        <rect width="900" height="480" fill="#fcfbf9"/>
        <rect x="20" y="20" width="860" height="440" rx="16" fill="#ffffff" stroke="#e5e5e5" stroke-width="1.5" filter="url(#shadow)"/>

        <!-- Header -->
        <rect x="20" y="20" width="860" height="50" rx="16" fill="url(#headerGrad)"/>
        <circle cx="45" cy="45" r="5" fill="#f97316"/>
        <text x="60" y="50" fill="#ffffff" font-size="14" font-weight="800" letter-spacing="0.5">PROCESS FLOW: ACCOUNTS PAYABLE &amp; INVOICE PROCESSING</text>
        <text x="740" y="50" fill="#a3a3a3" font-size="11" font-family="monospace">FLOWCHART v2.1</text>

        <!-- Swimlane Guides -->
        <line x1="40" y1="175" x2="860" y2="175" stroke="#f0f0f0" stroke-width="1" stroke-dasharray="4,4"/>
        <line x1="40" y1="315" x2="860" y2="315" stroke="#f0f0f0" stroke-width="1" stroke-dasharray="4,4"/>
        
        <text x="35" y="120" fill="#999" font-size="10" font-weight="700" font-family="monospace">VENDOR / INTAKE</text>
        <text x="35" y="240" fill="#999" font-size="10" font-weight="700" font-family="monospace">FINANCE TEAM</text>
        <text x="35" y="380" fill="#999" font-size="10" font-weight="700" font-family="monospace">MANAGEMENT / ERP</text>

        <!-- Step 1: Start / Trigger -->
        <rect x="50" y="95" width="130" height="60" rx="8" fill="#f5f4f0" stroke="#111111" stroke-width="2"/>
        <text x="115" y="120" fill="#111" font-size="11" font-weight="700" text-anchor="middle">1. EMAIL ARRIVAL</text>
        <text x="115" y="138" fill="#666" font-size="9" text-anchor="middle">Vendor sends PDF invoice</text>

        <!-- Arrow 1 -> 2 -->
        <path d="M 180 125 L 220 125 L 220 220 L 235 220" fill="none" stroke="#111" stroke-width="2" marker-end="url(#arrow)"/>

        <!-- Step 2: Download & Parse -->
        <rect x="240" y="190" width="145" height="60" rx="8" fill="#ffffff" stroke="#f97316" stroke-width="2"/>
        <rect x="240" y="190" width="145" height="18" rx="8" fill="#ffedd5"/>
        <text x="312" y="203" fill="#c2410c" font-size="9" font-weight="800" text-anchor="middle">MANUAL OVERHEAD</text>
        <text x="312" y="224" fill="#111" font-size="11" font-weight="700" text-anchor="middle">2. DOWNLOAD &amp; COPY</text>
        <text x="312" y="240" fill="#666" font-size="9" text-anchor="middle">Copy details into Excel sheet</text>

        <!-- Arrow 2 -> 3 -->
        <line x1="385" y1="220" x2="435" y2="220" stroke="#111" stroke-width="2"/>

        <!-- Step 3: Decision Diamond -->
        <polygon points="505,185 570,220 505,255 440,220" fill="#fafafa" stroke="#111" stroke-width="2"/>
        <text x="505" y="216" fill="#111" font-size="10" font-weight="800" text-anchor="middle">Amount</text>
        <text x="505" y="228" fill="#111" font-size="10" font-weight="800" text-anchor="middle">&gt; $5,000 ?</text>

        <!-- Decision YES Path (Down to Manager Approval) -->
        <path d="M 505 255 L 505 340 L 485 340" fill="none" stroke="#dc2626" stroke-width="2"/>
        <text x="515" y="280" fill="#dc2626" font-size="9" font-weight="700">YES</text>

        <!-- Step 4: Manager Approval -->
        <rect x="330" y="320" width="150" height="60" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
        <text x="405" y="342" fill="#991b1b" font-size="10" font-weight="800" text-anchor="middle">4. EMAIL MANAGER</text>
        <text x="405" y="358" fill="#666" font-size="9" text-anchor="middle">Wait 24-48h for reply</text>
        <text x="405" y="370" fill="#dc2626" font-size="8" font-weight="700" text-anchor="middle">⚠️ BOTTLENECK</text>

        <!-- Approval Path back to step 5 -->
        <path d="M 330 350 L 290 350 L 290 375 L 610 375 L 610 255 L 635 255" fill="none" stroke="#111" stroke-width="1.5" stroke-dasharray="3,3"/>

        <!-- Decision NO Path (Direct to Step 5) -->
        <line x1="570" y1="220" x2="635" y2="220" stroke="#16a34a" stroke-width="2"/>
        <text x="590" y="212" fill="#16a34a" font-size="9" font-weight="700">NO</text>

        <!-- Step 5: Post to QuickBooks -->
        <rect x="640" y="190" width="135" height="60" rx="8" fill="#ffffff" stroke="#111" stroke-width="2"/>
        <text x="707" y="216" fill="#111" font-size="10" font-weight="700" text-anchor="middle">5. ENTER IN QB</text>
        <text x="707" y="232" fill="#666" font-size="9" text-anchor="middle">Manual ledger entry</text>
        <text x="707" y="244" fill="#666" font-size="8" text-anchor="middle">Tool: QuickBooks Online</text>

        <!-- Arrow 5 -> 6 -->
        <line x1="775" y1="220" x2="800" y2="220" stroke="#111" stroke-width="2"/>

        <!-- Step 6: Complete / Archive -->
        <rect x="805" y="190" width="60" height="60" rx="30" fill="#111" stroke="#111" stroke-width="2"/>
        <text x="835" y="222" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle">DONE</text>
        <text x="835" y="235" fill="#f97316" font-size="8" text-anchor="middle">Archive</text>
      </svg>
    `),
  },
  {
    id: "customer-onboarding",
    title: "Customer Onboarding & Provisioning Process",
    subtitle: "Sales to Customer Success Handoff",
    description: "Process diagram showing deal closing in Salesforce, Slack ping, Google Drive folder creation, DocuSign contract, and manual DB provisioning.",
    badge: "Process Map",
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="900" height="480" style="background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace, sans-serif;">
        <defs>
          <linearGradient id="headerGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#334155"/>
          </linearGradient>
        </defs>

        <rect width="900" height="480" fill="#fcfbf9"/>
        <rect x="20" y="20" width="860" height="440" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

        <!-- Header -->
        <rect x="20" y="20" width="860" height="50" rx="16" fill="url(#headerGrad2)"/>
        <circle cx="45" cy="45" r="5" fill="#38bdf8"/>
        <text x="60" y="50" fill="#ffffff" font-size="14" font-weight="800" letter-spacing="0.5">WORKFLOW MAP: B2B CLIENT ONBOARDING &amp; HANDOFF</text>
        <text x="730" y="50" fill="#94a3b8" font-size="11" font-family="monospace">OPERATIONS v1.4</text>

        <!-- Swimlane Rows -->
        <rect x="40" y="85" width="820" height="85" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="55" y="110" fill="#64748b" font-size="10" font-weight="700" font-family="monospace">SALES TEAM</text>

        <rect x="40" y="180" width="820" height="85" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="55" y="205" fill="#64748b" font-size="10" font-weight="700" font-family="monospace">CLIENT SUCCESS</text>

        <rect x="40" y="275" width="820" height="85" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="55" y="300" fill="#64748b" font-size="10" font-weight="700" font-family="monospace">ENGINEERING / IT</text>

        <rect x="40" y="370" width="820" height="80" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="55" y="395" fill="#64748b" font-size="10" font-weight="700" font-family="monospace">CUSTOMER</text>

        <!-- Box 1: Deal Closed -->
        <rect x="160" y="98" width="130" height="60" rx="8" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
        <text x="225" y="122" fill="#0369a1" font-size="10" font-weight="800" text-anchor="middle">1. DEAL CLOSED</text>
        <text x="225" y="138" fill="#64748b" font-size="9" text-anchor="middle">Salesforce CRM status</text>

        <!-- Arrow Down to CS -->
        <path d="M 225 158 L 225 198" fill="none" stroke="#0f172a" stroke-width="2"/>

        <!-- Box 2: Manual Slack Handoff -->
        <rect x="160" y="195" width="140" height="60" rx="8" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/>
        <text x="230" y="218" fill="#c2410c" font-size="10" font-weight="800" text-anchor="middle">2. SLACK HANDOFF</text>
        <text x="230" y="234" fill="#64748b" font-size="9" text-anchor="middle">Rep manually pings CS</text>
        <text x="230" y="246" fill="#ea580c" font-size="8" font-weight="700" text-anchor="middle">⚠️ Context switching</text>

        <!-- Arrow to Drive Folder -->
        <line x1="300" y1="225" x2="340" y2="225" stroke="#0f172a" stroke-width="2"/>

        <!-- Box 3: Google Drive & DocuSign -->
        <rect x="345" y="195" width="150" height="60" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
        <text x="420" y="218" fill="#0f172a" font-size="10" font-weight="800" text-anchor="middle">3. CREATE DRIVE FOLDER</text>
        <text x="420" y="234" fill="#64748b" font-size="9" text-anchor="middle">Duplicate template &amp; send DocuSign</text>

        <!-- Arrow Down to Customer -->
        <path d="M 420 255 L 420 385" fill="none" stroke="#0f172a" stroke-width="2"/>

        <!-- Box 4: Customer Signs -->
        <rect x="350" y="385" width="140" height="55" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
        <text x="420" y="408" fill="#15803d" font-size="10" font-weight="800" text-anchor="middle">4. SIGN CONTRACT</text>
        <text x="420" y="424" fill="#64748b" font-size="9" text-anchor="middle">E-signature executed</text>

        <!-- Arrow Up to IT -->
        <path d="M 490 412 L 550 412 L 550 320 L 590 320" fill="none" stroke="#0f172a" stroke-width="2"/>

        <!-- Box 5: IT Provisioning -->
        <rect x="595" y="290" width="150" height="60" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
        <text x="670" y="312" fill="#991b1b" font-size="10" font-weight="800" text-anchor="middle">5. MANUAL DB PROVISION</text>
        <text x="670" y="328" fill="#64748b" font-size="9" text-anchor="middle">Engineer runs SQL scripts</text>
        <text x="670" y="340" fill="#dc2626" font-size="8" font-weight="700" text-anchor="middle">⚠️ High error risk</text>

        <!-- Arrow to Complete -->
        <line x1="745" y1="320" x2="790" y2="320" stroke="#0f172a" stroke-width="2"/>

        <!-- Box 6: Onboarded -->
        <rect x="795" y="290" width="55" height="60" rx="27" fill="#0f172a" stroke="#0f172a" stroke-width="2"/>
        <text x="822" y="320" fill="#ffffff" font-size="9" font-weight="800" text-anchor="middle">LIVE</text>
        <text x="822" y="333" fill="#38bdf8" font-size="7" text-anchor="middle">Active</text>
      </svg>
    `),
  },
  {
    id: "weekly-analytics-reporting",
    title: "Weekly Multi-Source Reporting Architecture",
    subtitle: "Data Analytics & Executive Reporting",
    description: "Process diagram showing manual CSV exports from Stripe, HubSpot, Google Analytics into Google Sheets, manual chart formatting, and PowerPoint assembly.",
    badge: "Architecture",
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="900" height="480" style="background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace, sans-serif;">
        <rect width="900" height="480" fill="#fcfbf9"/>
        <rect x="20" y="20" width="860" height="440" rx="16" fill="#ffffff" stroke="#e5e5e5" stroke-width="1.5"/>

        <!-- Header -->
        <rect x="20" y="20" width="860" height="50" rx="16" fill="#111111"/>
        <circle cx="45" cy="45" r="5" fill="#eab308"/>
        <text x="60" y="50" fill="#ffffff" font-size="14" font-weight="800" letter-spacing="0.5">SYSTEM DIAGRAM: WEEKLY KPI CONSOLIDATION &amp; SLIDES</text>
        <text x="730" y="50" fill="#737373" font-size="11" font-family="monospace">WEEKLY CADENCE</text>

        <!-- 3 Sources on Left -->
        <rect x="50" y="95" width="150" height="50" rx="8" fill="#f8fafc" stroke="#6366f1" stroke-width="1.5"/>
        <text x="125" y="118" fill="#4338ca" font-size="10" font-weight="800" text-anchor="middle">STRIPE PAYMENTS</text>
        <text x="125" y="132" fill="#64748b" font-size="8" text-anchor="middle">Export Revenue CSV</text>

        <rect x="50" y="165" width="150" height="50" rx="8" fill="#f8fafc" stroke="#f97316" stroke-width="1.5"/>
        <text x="125" y="188" fill="#ea580c" font-size="10" font-weight="800" text-anchor="middle">HUBSPOT CRM</text>
        <text x="125" y="202" fill="#64748b" font-size="8" text-anchor="middle">Export Pipeline CSV</text>

        <rect x="50" y="235" width="150" height="50" rx="8" fill="#f8fafc" stroke="#eab308" stroke-width="1.5"/>
        <text x="125" y="258" fill="#ca8a04" font-size="10" font-weight="800" text-anchor="middle">GOOGLE ANALYTICS</text>
        <text x="125" y="272" fill="#64748b" font-size="8" text-anchor="middle">Export Traffic CSV</text>

        <!-- Arrows to Master Sheet -->
        <path d="M 200 120 L 300 190" fill="none" stroke="#111" stroke-width="1.5"/>
        <path d="M 200 190 L 300 190" fill="none" stroke="#111" stroke-width="1.5"/>
        <path d="M 200 260 L 300 190" fill="none" stroke="#111" stroke-width="1.5"/>

        <!-- Central Master Sheet -->
        <rect x="305" y="145" width="180" height="95" rx="10" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/>
        <rect x="305" y="145" width="180" height="20" rx="10" fill="#ffedd5"/>
        <text x="395" y="159" fill="#c2410c" font-size="9" font-weight="800" text-anchor="middle">MANUAL DATA CONSOLIDATION</text>
        <text x="395" y="182" fill="#111" font-size="11" font-weight="800" text-anchor="middle">MASTER GOOGLE SHEET</text>
        <text x="395" y="200" fill="#666" font-size="9" text-anchor="middle">VLOOKUP formulas &amp; merging</text>
        <text x="395" y="222" fill="#ea580c" font-size="9" font-weight="700" text-anchor="middle">⏱ 3.5 Hours / Week</text>

        <!-- Arrow to PowerPoint Deck -->
        <line x1="485" y1="190" x2="565" y2="190" stroke="#111" stroke-width="2"/>

        <!-- PowerPoint assembly -->
        <rect x="570" y="150" width="165" height="85" rx="10" fill="#ffffff" stroke="#111" stroke-width="2"/>
        <text x="652" y="178" fill="#111" font-size="11" font-weight="800" text-anchor="middle">POWERPOINT DECK</text>
        <text x="652" y="196" fill="#666" font-size="9" text-anchor="middle">Pasting screenshot charts</text>
        <text x="652" y="210" fill="#666" font-size="9" text-anchor="middle">Manual number formatting</text>

        <!-- Arrow to Executive Review -->
        <line x1="735" y1="190" x2="795" y2="190" stroke="#111" stroke-width="2"/>

        <rect x="800" y="160" width="60" height="65" rx="10" fill="#111" stroke="#111"/>
        <text x="830" y="192" fill="#fff" font-size="10" font-weight="800" text-anchor="middle">VP / EXEC</text>
        <text x="830" y="208" fill="#f97316" font-size="8" text-anchor="middle">Review</text>

        <!-- Friction Callout Box at Bottom -->
        <rect x="50" y="320" width="810" height="120" rx="10" fill="#fafafa" stroke="#e5e5e5"/>
        <text x="70" y="345" fill="#111" font-size="12" font-weight="800">FRICTION AUDIT SUMMARY:</text>
        <text x="70" y="370" fill="#444" font-size="11">• 3 manual CSV downloads every Friday morning</text>
        <text x="70" y="390" fill="#444" font-size="11">• Fragile copy-pasting prone to column mismatch</text>
        <text x="70" y="410" fill="#444" font-size="11">• Recommendation: Direct API connectors to Google Sheets or Automated Looker Dashboard</text>
      </svg>
    `),
  },
];
