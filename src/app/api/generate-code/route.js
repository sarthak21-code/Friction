import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MAX_TASK_LENGTH = 500;
const MAX_SUGGESTION_LENGTH = 2000;
const MAX_WORKFLOW_CONTEXT_LENGTH = 5000;

export async function POST(request) {
  // 1. Rate Limiting (15 requests per minute per IP)
  const rateLimit = checkRateLimit(request, "generate-code", 15, 60000);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSec);
  }

  try {
    // 2. Safe JSON Body Parsing
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid or malformed JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const {
      workflow,
      opportunity,
      frictionPoints,
      tools,
      language = "Python",
      estimatedTimeWasted,
    } = body;

    // 3. Input Validation
    if (!opportunity || typeof opportunity !== "object" || !opportunity.task || typeof opportunity.task !== "string" || !opportunity.task.trim()) {
      return NextResponse.json(
        { error: "Automation opportunity task details are required." },
        { status: 400 }
      );
    }

    if (opportunity.task.length > MAX_TASK_LENGTH) {
      return NextResponse.json(
        { error: `Opportunity task description exceeds the maximum length of ${MAX_TASK_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (opportunity.suggestion && typeof opportunity.suggestion === "string" && opportunity.suggestion.length > MAX_SUGGESTION_LENGTH) {
      return NextResponse.json(
        { error: `Opportunity suggestion exceeds the maximum length of ${MAX_SUGGESTION_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const cleanWorkflow = typeof workflow === "string" ? workflow.slice(0, MAX_WORKFLOW_CONTEXT_LENGTH) : "";
    const cleanLanguage = typeof language === "string" ? language.slice(0, 50) : "Python";

    const prompt = `
You are the expert automation engineer behind FRICTION's "1-Click Starter Code Generator".
FRICTION analyzes real-world business workflows, diagnoses inefficiencies, and generates targeted, runnable starter projects so developers and operations teams can immediately automate friction points.

Task to automate: "${opportunity.task.trim()}"
Suggestion: "${opportunity.suggestion ? String(opportunity.suggestion).trim() : ""}"
Expected Benefit: "${opportunity.benefit ? String(opportunity.benefit).trim() : ""}"
Requested Language: ${cleanLanguage}
Relevant Tools / Ecosystem: ${Array.isArray(tools) ? tools.join(", ") : (opportunity.tools || []).join(", ") || "Standard Libraries"}

Original Workflow Context:
"${cleanWorkflow || "Business workflow automation"}"

Friction Points identified:
${Array.isArray(frictionPoints) ? frictionPoints.map((f) => `- ${f.problem || f.step || f}`).join("\n") : "Manual repetition and latency"}

Estimated Time Waste: ${estimatedTimeWasted?.value ? `${estimatedTimeWasted.value} ${estimatedTimeWasted.unit || "min/day"}` : "Significant manual delay"}

YOUR GOAL:
Generate a complete, pragmatic, clean starter codebase in ${cleanLanguage} to automate this specific task.

CRITICAL CODE QUALITY & SECURITY RULES:
1. Syntactically valid, runnable starter project.
2. Production-style clean code with clear docstrings and comments.
3. NEVER hardcode any secrets, credentials, or actual API keys. Use environment variables (e.g. process.env or os.getenv).
4. Put clear "TODO: Configure your endpoint / webhook" annotations where user-specific config is required.
5. Provide realistic dependency file (requirements.txt for Python, package.json for Node/JS).
6. Provide a complete, helpful README.md covering:
   - What this automation does
   - Requirements & Prerequisites
   - Installation steps
   - Environment variables needed
   - How to run and test locally
   - Customization tips & Next steps
7. Provide a .env.example file.
8. Keep the starter project focused (3 to 5 files maximum).
9. Return ONLY valid JSON.
10. Do NOT use markdown fences or comments in the JSON.

Return exactly this JSON schema:
{
  "explanation": "2-3 sentence overview explaining how this starter code automates the target task and removes friction.",
  "language": "${cleanLanguage}",
  "framework": "e.g. FastAPI / Flask / Node.js / Express / Script",
  "complexity": "Low | Moderate | Advanced",
  "files": [
    {
      "name": "${cleanLanguage.toLowerCase() === "python" ? "main.py" : "index.js"}",
      "language": "${cleanLanguage.toLowerCase() === "python" ? "python" : "javascript"}",
      "content": "Full source code here..."
    },
    {
      "name": "${cleanLanguage.toLowerCase() === "python" ? "requirements.txt" : "package.json"}",
      "language": "${cleanLanguage.toLowerCase() === "python" ? "text" : "json"}",
      "content": "Dependencies here..."
    },
    {
      "name": ".env.example",
      "language": "env",
      "content": "KEY=value_placeholder\\n..."
    },
    {
      "name": "README.md",
      "language": "markdown",
      "content": "Full markdown documentation..."
    }
  ],
  "environmentVariables": [
    {
      "key": "ENV_VAR_NAME",
      "description": "What this variable is used for",
      "required": true
    }
  ],
  "setupInstructions": [
    "Step 1: Clone or extract files",
    "Step 2: Install dependencies",
    "Step 3: Copy .env.example to .env and configure secrets",
    "Step 4: Run the script / server"
  ],
  "nextSteps": [
    "Add webhook trigger in your source platform",
    "Set up cron schedule or cloud function deployment"
  ]
}
`;

    const modelCandidates = [
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash",
    ];

    let responseText = null;
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} code gen attempt failed:`, err.message);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error("Failed to generate starter code from AI provider.");
    }

    let cleanedText = responseText.trim();
    cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    let starterProject;
    try {
      starterProject = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse code generator JSON response:", parseErr, cleanedText);

      const isPy = cleanLanguage.toLowerCase() === "python";
      starterProject = {
        explanation: `Starter automation template in ${cleanLanguage} for ${opportunity.task}.`,
        language: cleanLanguage,
        framework: isPy ? "Python Script" : "Node.js",
        complexity: "Moderate",
        files: [
          {
            name: isPy ? "main.py" : "index.js",
            language: isPy ? "python" : "javascript",
            content: isPy
              ? `# Automation Starter: ${opportunity.task}\nimport os\n\ndef run_automation():\n    print("Starting automation for ${opportunity.task}...")\n    # TODO: Connect source API and process items\n    print("Completed successfully.")\n\nif __name__ == "__main__":\n    run_automation()\n`
              : `// Automation Starter: ${opportunity.task}\nrequire('dotenv').config();\n\nasync function runAutomation() {\n  console.log("Starting automation for ${opportunity.task}...");\n  // TODO: Connect source API and process items\n  console.log("Completed successfully.");\n}\n\nrunAutomation();\n`,
          },
          {
            name: isPy ? "requirements.txt" : "package.json",
            language: isPy ? "text" : "json",
            content: isPy
              ? `python-dotenv>=1.0.0\nrequests>=2.31.0\n`
              : `{\n  "name": "automation-starter",\n  "version": "1.0.0",\n  "main": "index.js",\n  "dependencies": {\n    "dotenv": "^16.4.5",\n    "axios": "^1.7.2"\n  }\n}\n`,
          },
          {
            name: ".env.example",
            language: "env",
            content: `# Secrets & API Config for ${opportunity.task}\nAPI_KEY=your_api_key_here\nENDPOINT_URL=https://api.example.com/v1\n`,
          },
          {
            name: "README.md",
            language: "markdown",
            content: `# ${opportunity.task} — Starter Automation\n\nAutomates: ${opportunity.suggestion || opportunity.task}\n\n## Quick Start\n1. Configure \`.env\` from \`.env.example\`\n2. Install dependencies\n3. Run script\n`,
          },
        ],
        environmentVariables: [
          { key: "API_KEY", description: "API Key for target platform", required: true },
        ],
        setupInstructions: [
          "Install dependencies",
          "Set environment variables in .env",
          "Run script",
        ],
        nextSteps: ["Connect production endpoints", "Deploy to cloud runner"],
      };
    }

    return NextResponse.json({
      success: true,
      starterProject,
    });
  } catch (error) {
    console.error("Code Generator error:", error);
    return NextResponse.json(
      {
        error: "We couldn't generate the starter code right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
