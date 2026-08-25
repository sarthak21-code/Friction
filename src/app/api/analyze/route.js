import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Maximum allowed workflow input length (5,000 chars allows detailed multi-step enterprise workflows)
const MAX_WORKFLOW_LENGTH = 5000;

export async function POST(request) {
  // 1. Rate Limiting (20 requests per minute per IP)
  const rateLimit = checkRateLimit(request, "analyze", 20, 60000);
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

    const { workflow } = body;

    // 3. Input Validation
    if (!workflow || typeof workflow !== "string" || !workflow.trim()) {
      return NextResponse.json(
        { error: "Workflow description is required." },
        { status: 400 }
      );
    }

    if (workflow.length > MAX_WORKFLOW_LENGTH) {
      return NextResponse.json(
        {
          error: `Workflow description exceeds the maximum length of ${MAX_WORKFLOW_LENGTH.toLocaleString()} characters (received ${workflow.length.toLocaleString()}). Please shorten your description.`,
        },
        { status: 400 }
      );
    }

    const prompt = `
You are the AI engine behind a product called FRICTION.

FRICTION analyzes real-world workflows and identifies unnecessary manual work,
then recommends the best improved workflow.

Analyze this workflow:

"${workflow.trim()}"

Your job is NOT just to describe problems.
Your most important job is to determine:

1. Where the friction is.
2. How severe the friction is.
3. What should be automated first.
4. Approximately how much time could potentially be saved.
5. What tools or technologies could solve the problem.
6. What the user's improved workflow should look like.

IMPORTANT:
- Do not invent exact measurements when the workflow does not provide enough information.
- Time savings should be clearly marked as an estimate.
- Prioritize practical recommendations.
- The recommended workflow should be simpler than the original workflow.
- Focus on removing repetitive manual work.
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT wrap the JSON in code fences.

FRICTION SCORE RULES:

friction_score must be an integer from 0 to 100.

0 = almost no friction.
100 = extremely inefficient workflow.

Base the score on:
- amount of manual work
- repetition
- waiting
- number of handoffs
- error risk
- unnecessary steps

For friction_breakdown:
- Each value must be an integer from 0 to 100.
- The four values do NOT need to add up to 100.
- They represent the severity of each type of friction.

For estimated_time_wasted:
- Never pretend to know an exact number if the workflow doesn't provide enough information.
- Give a reasonable estimate.
- Clearly explain the assumption.
- If there isn't enough information, use confidence "Low".

For before_after:
- Extract the actual major steps from the user's workflow.
- Do not invent unrelated steps.
- Keep the "after" workflow simpler than the "before" workflow.

For automation opportunities:
- "Now" means highest priority.
- "Next" means useful after the highest-priority improvement.
- "Later" means lower priority.

The top_recommendation must identify ONE improvement that provides the greatest practical reduction in friction.

Return exactly this JSON structure:

{
  "summary": "Short explanation of the main source of friction",

  "friction_score": 0,

  "severity": "Low | Medium | High | Critical",

  "estimated_time_wasted": {
    "value": 0,
    "unit": "minutes per day",
    "confidence": "Low | Medium | High",
    "assumptions": "Brief explanation of how this estimate was made"
  },

  "automation_potential": "Low | Medium | High",

  "friction_breakdown": {
    "manual_work": 0,
    "repetition": 0,
    "waiting": 0,
    "handoffs": 0
  },

  "friction_points": [
    {
      "step": "Problematic workflow step",
      "problem": "Why this creates friction",
      "impact": "Business or operational impact",
      "severity": "Low | Medium | High"
    }
  ],

  "automation_opportunities": [
    {
      "task": "Task that should be automated",
      "priority": "Now | Next | Later",
      "suggestion": "How to automate it",
      "benefit": "Expected benefit",
      "tools": [
        "Tool or technology"
      ]
    }
  ],

  "top_recommendation": {
    "title": "Most important improvement",
    "reason": "Why this should be implemented first",
    "expected_impact": "Expected improvement"
  },

  "recommended_workflow": [
    {
      "step": 1,
      "action": "What happens",
      "automation": "Manual | Partially Automated | Automated"
    }
  ],

  "before_after": {
    "before": [
      "Workflow step 1",
      "Workflow step 2",
      "Workflow step 3"
    ],
    "after": [
      "Improved workflow step 1",
      "Improved workflow step 2",
      "Improved workflow step 3"
    ]
  }
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
        console.warn(`Model ${model} analyze attempt failed:`, err.message);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Failed to analyze workflow");
    }

    const text = response.text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (error) {
      console.error("Gemini returned invalid JSON:", text);
      return NextResponse.json(
        {
          error: "Failed to parse analysis response from AI provider. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred during workflow analysis. Please try again.",
      },
      { status: 500 }
    );
  }
}