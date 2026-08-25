import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Maximum allowed question length
const MAX_QUESTION_LENGTH = 1000;
const MAX_CONTEXT_LENGTH = 5000;

export async function POST(request) {
  // 1. Rate Limiting (30 requests per minute per IP)
  const rateLimit = checkRateLimit(request, "ask", 30, 60000);
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
      question,
      workflow,
      friction,
      recommendation,
      recommendedWorkflow,
      implementationSteps,
      tools,
      analysis,
    } = body;

    // 3. Input Validation
    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        {
          error: `Question exceeds the maximum length of ${MAX_QUESTION_LENGTH.toLocaleString()} characters (received ${question.length.toLocaleString()}). Please shorten your question.`,
        },
        { status: 400 }
      );
    }

    // Sanitize optional context length
    const cleanWorkflow = typeof workflow === "string" ? workflow.slice(0, MAX_CONTEXT_LENGTH) : "";
    const workflowContext = cleanWorkflow ? `Original Workflow:\n"${cleanWorkflow}"` : "";

    const frictionContext =
      friction || analysis?.friction_points
        ? `Friction Detected:\n${
            typeof friction === "string"
              ? friction.slice(0, MAX_CONTEXT_LENGTH)
              : analysis?.friction_points?.map((f) => `- ${f.problem} (Impact: ${f.impact})`).join("\n") || "High manual overhead"
          }`
        : "";

    const recommendationContext =
      recommendation || analysis?.top_recommendation?.title
        ? `Top Recommendation:\n${
            typeof recommendation === "string"
              ? recommendation.slice(0, MAX_CONTEXT_LENGTH)
              : `${analysis?.top_recommendation?.title}: ${analysis?.top_recommendation?.reason || ""}`
          }`
        : "";

    const toolsContext =
      tools || analysis?.automation_opportunities
        ? `Recommended Tools:\n${
            Array.isArray(tools)
              ? tools.join(", ")
              : analysis?.automation_opportunities
                  ?.flatMap((o) => o.tools || [])
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .join(", ") || "Zapier, Make, Python"
          }`
        : "";

    const stepsContext =
      implementationSteps || recommendedWorkflow || analysis?.recommended_workflow
        ? `Implementation / Target Workflow:\n${
            Array.isArray(implementationSteps)
              ? implementationSteps.map((s, i) => `${i + 1}. ${s.title || s}`).join("\n")
              : Array.isArray(recommendedWorkflow)
              ? recommendedWorkflow.map((s, i) => `${i + 1}. ${s.action || s}`).join("\n")
              : analysis?.recommended_workflow?.map((s, i) => `${i + 1}. ${s.action}`).join("\n") || ""
          }`
        : "";

    const prompt = `
You are "Ask FRICTION", an expert AI workflow consultant and automation systems engineer.
The user has a question, doubt, or custom requirement regarding their workflow diagnosis and implementation.

${workflowContext}
${frictionContext}
${recommendationContext}
${toolsContext}
${stepsContext}

User Question / Doubt:
"${question.trim()}"

Your job is to provide an immediate, practical, and highly actionable resolution.
- Be concise, direct, and pragmatic.
- Avoid vague advice. Recommend concrete tools, techniques, formulas, or integration patterns.
- If asked about free tools, recommend open-source or generous free tier tools (e.g. n8n, Python, Google Apps Script, Make free tier).
- If asked about edge cases or errors, provide specific fallback patterns (e.g. try/catch, Slack alert webhook, manual review queue).
- Return ONLY valid JSON.
- Do NOT use markdown code fences.

Return exactly this JSON structure:
{
  "direct_answer": "Clear, direct 2-3 sentence answer resolving the doubt",
  "action_steps": [
    "Step 1: Specific actionable step",
    "Step 2: Specific actionable step",
    "Step 3: Specific actionable step"
  ],
  "recommended_tools": [
    "Tool 1",
    "Tool 2"
  ],
  "pro_tip": "One concise expert tip or best practice for this situation"
}
`;

    const modelCandidates = [
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash",
    ];

    let response;
    let lastError;

    for (const model of modelCandidates) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        if (response && response.text) {
          break;
        }
      } catch (err) {
        console.warn(`Model ${model} Ask FRICTION attempt failed:`, err.message);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Failed to generate solution from AI provider");
    }

    let text = response.text || "";
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let answer;
    try {
      answer = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse fallback for Ask FRICTION:", text);
      answer = {
        direct_answer: text || "Here is the recommended approach for your workflow query.",
        action_steps: [
          "Define the specific trigger condition in your automation platform.",
          "Add validation rules to catch edge cases early.",
          "Route exceptions to a dedicated notification channel.",
        ],
        recommended_tools: ["Zapier", "Make", "Google Apps Script"],
        pro_tip: "Always test edge cases with at least 3 live samples before deploying.",
      };
    }

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("Ask FRICTION error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your question. Please try again." },
      { status: 500 }
    );
  }
}
