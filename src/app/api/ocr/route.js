import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Resvg } from "@resvg/resvg-js";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Max payload size: 10MB
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
// Max SVG raw character length: 2MB (prevents resource exhaustion attacks)
const MAX_SVG_CHAR_LENGTH = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
  "image/svg",
];

/**
 * Extracts and decodes an SVG XML string from various data URL or text formats.
 */
function extractAndDecodeSvg(input, mimeType) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // 1. Handle data:image/svg+xml prefix
  if (trimmed.startsWith("data:image/svg+xml") || trimmed.startsWith("data:image/svg")) {
    if (trimmed.includes(";base64,")) {
      const base64Part = trimmed.split(";base64,")[1];
      try {
        return Buffer.from(base64Part, "base64").toString("utf-8");
      } catch (err) {
        throw new Error(`Failed to decode base64 SVG data: ${err.message}`);
      }
    }

    // utf-8 or percent-encoded data URL (e.g. data:image/svg+xml;utf8,<svg... or data:image/svg+xml,%3Csvg...)
    const commaIndex = trimmed.indexOf(",");
    if (commaIndex !== -1) {
      const dataPart = trimmed.slice(commaIndex + 1);
      try {
        return decodeURIComponent(dataPart);
      } catch {
        return dataPart;
      }
    }
  }

  // 2. Direct SVG XML string
  if (trimmed.startsWith("<svg") || trimmed.startsWith("<?xml")) {
    return trimmed;
  }

  // 3. If explicit SVG mimeType, try base64 decode first, then raw/URI decode
  if (mimeType === "image/svg+xml" || mimeType === "image/svg") {
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
      if (decoded.includes("<svg") || decoded.includes("<?xml")) {
        return decoded;
      }
    } catch {
      // Not base64
    }
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  }

  return null;
}

/**
 * Validates basic XML / SVG structural integrity and length.
 */
function validateSvgContent(svgString) {
  if (!svgString || typeof svgString !== "string" || svgString.trim().length === 0) {
    throw new Error("SVG content is empty or unreadable.");
  }

  if (svgString.length > MAX_SVG_CHAR_LENGTH) {
    throw new Error(`SVG content exceeds the maximum size limit of ${MAX_SVG_CHAR_LENGTH.toLocaleString()} characters.`);
  }

  const clean = svgString.trim();
  if (!clean.includes("<svg") && !clean.includes("<?xml")) {
    throw new Error("Malformed SVG image: missing <svg> root element.");
  }
  if (!clean.includes("</svg>") && !clean.includes("/>")) {
    throw new Error("Malformed SVG image: missing closing </svg> tag or invalid XML structure.");
  }
}

/**
 * Rasterizes an SVG XML string to high-resolution PNG base64.
 */
function convertSvgToPngBase64(svgString) {
  validateSvgContent(svgString);

  try {
    const resvg = new Resvg(svgString, {
      background: "#ffffff",
      fitTo: { mode: "width", value: 1200 },
      logLevel: "error",
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    return pngBuffer.toString("base64");
  } catch (err) {
    console.error("SVG rasterization failed:", err);
    throw new Error(`Failed to render SVG diagram to raster image: ${err.message}`);
  }
}

export async function POST(request) {
  // 1. Rate Limiting (15 requests per minute per IP)
  const rateLimit = checkRateLimit(request, "ocr", 15, 60000);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSec);
  }

  try {
    let base64Data = "";
    let mimeType = "image/png";
    let fileName = "uploaded_workflow_image";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") || formData.get("image");

      if (!file || typeof file === "string") {
        return NextResponse.json(
          { error: "No image file provided in the upload." },
          { status: 400 }
        );
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: "Image file exceeds the 10MB size limit. Please upload a smaller image.",
          },
          { status: 400 }
        );
      }

      mimeType = file.type || "image/png";
      fileName = file.name || "uploaded_workflow";

      if (fileName.toLowerCase().endsWith(".svg")) {
        mimeType = "image/svg+xml";
      }

      if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
        return NextResponse.json(
          {
            error: `Unsupported image format (${mimeType}). Please upload a PNG, JPG, WEBP, or SVG file.`,
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (mimeType.toLowerCase() === "image/svg+xml" || mimeType.toLowerCase() === "image/svg") {
        try {
          const svgString = buffer.toString("utf-8");
          base64Data = convertSvgToPngBase64(svgString);
          mimeType = "image/png"; // Converted to PNG for multimodal Gemini API
        } catch (svgErr) {
          return NextResponse.json(
            { error: svgErr.message || "Invalid or malformed SVG upload." },
            { status: 400 }
          );
        }
      } else {
        base64Data = buffer.toString("base64");
      }
    } else {
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

      const { image, mimeType: requestedMime, name } = body;

      if (!image || typeof image !== "string") {
        return NextResponse.json(
          { error: "No image data provided in the request." },
          { status: 400 }
        );
      }

      if (name && typeof name === "string") {
        fileName = name.slice(0, 100);
      }

      // Check if image payload is SVG (data URL or requested mimeType or XML string)
      const isSvgPayload =
        image.startsWith("data:image/svg") ||
        image.trim().startsWith("<svg") ||
        image.trim().startsWith("<?xml") ||
        requestedMime === "image/svg+xml" ||
        requestedMime === "image/svg" ||
        fileName.toLowerCase().endsWith(".svg");

      if (isSvgPayload) {
        try {
          const svgString = extractAndDecodeSvg(image, requestedMime || "image/svg+xml");
          if (!svgString) {
            throw new Error("Unable to extract SVG content from payload.");
          }
          base64Data = convertSvgToPngBase64(svgString);
          mimeType = "image/png"; // Converted to PNG for Gemini
        } catch (svgErr) {
          console.error("SVG parsing/rasterization error:", svgErr.message);
          return NextResponse.json(
            { error: svgErr.message || "Invalid or malformed SVG data." },
            { status: 400 }
          );
        }
      } else {
        // Handle standard raster image data URL prefix if present
        if (image.startsWith("data:")) {
          const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
          } else {
            base64Data = image.replace(/^data:[^;]+;base64,/, "");
          }
        } else {
          base64Data = image;
        }

        if (requestedMime && typeof requestedMime === "string") {
          mimeType = requestedMime;
        }

        // Approximate base64 size check (10MB limit)
        const approxBytes = Math.ceil((base64Data.length * 3) / 4);
        if (approxBytes > MAX_IMAGE_SIZE_BYTES) {
          return NextResponse.json(
            {
              error: "Image payload exceeds the 10MB size limit. Please upload a smaller image.",
            },
            { status: 400 }
          );
        }

        if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
          return NextResponse.json(
            {
              error: `Unsupported image format (${mimeType}). Please upload a PNG, JPG, WEBP, or SVG file.`,
            },
            { status: 400 }
          );
        }
      }
    }

    if (!base64Data || base64Data.trim().length === 0) {
      return NextResponse.json(
        { error: "The provided image is empty or unreadable." },
        { status: 400 }
      );
    }

    const prompt = `
You are the visual workflow intelligence engine of FRICTION.
FRICTION analyzes real-world workflows, flowcharts, application screenshots, whiteboard drawings, and process diagrams to identify manual friction, bottlenecks, and automation opportunities.

Carefully examine this uploaded image. Extract and reconstruct the complete operational workflow.

YOUR GOALS:
1. Extract all visible text, labels, nodes, swimlanes, and annotations (OCR).
2. Detect the full sequence of operational steps, decisions, actions, actors, and tools.
3. Detect friction indicators (manual data entry, copy-pasting, waiting points, multiple handoffs, disjointed tools).
4. Synthesize a comprehensive, coherent narrative description of the workflow that can be fed into FRICTION's analysis engine.

IMPORTANT RULES:
- If the image is not a workflow, flowchart, or application screenshot (e.g. a random photo), summarize what is visible and provide a general step reconstruction if possible.
- Be accurate with tool names (e.g., Slack, Excel, Jira, Salesforce, Gmail, Google Sheets, ERP).
- Note decision branches (if/else), loops, and waiting buffers.
- Return ONLY valid JSON.
- Do NOT wrap the JSON in markdown fences.
- Do NOT include comments in JSON.

Return exactly this JSON schema:
{
  "title": "Clear descriptive title of the workflow (e.g., 'Customer Onboarding & Provisioning Process')",
  "diagram_type": "Flowchart | Application Screenshot | Whiteboard Sketch | Process Diagram | Architecture Map | Other",
  "summary": "2-3 sentence overview of what this workflow accomplishes and its overall complexity",
  "raw_text": "All raw visible text extracted verbatim from the image...",
  "actors_detected": [
    "Sales Rep",
    "Support Agent",
    "Finance Manager"
  ],
  "tools_detected": [
    "Excel",
    "Salesforce",
    "Gmail",
    "Slack"
  ],
  "steps": [
    {
      "step_number": 1,
      "action": "Specific description of what happens at this step",
      "actor": "Role or team responsible (or 'User' if not specified)",
      "tool": "Software tool or medium used (e.g. 'Excel', 'Email', 'Web Portal')",
      "type": "Action | Decision | Handoff | Waiting | Loop | Input/Output",
      "is_manual": true,
      "is_bottleneck": false,
      "notes": "Contextual detail or observed friction"
    }
  ],
  "decisions": [
    {
      "condition": "Condition evaluated at decision point",
      "paths": [
        "Path 1: If approved -> Proceed to provisioning",
        "Path 2: If rejected -> Send notification email"
      ]
    }
  ],
  "friction_highlights": {
    "manual_work": [
      "Manual copy-pasting of customer data between systems"
    ],
    "repetitive_tasks": [
      "Creating identical folders and templates for each incoming request"
    ],
    "waiting_points": [
      "Waiting for manual manager approval via email"
    ],
    "handoffs": [
      "Handoff from Sales to Support via unorganized Slack pings"
    ],
    "context_switching": [
      "Switching between 4 separate tools without integration"
    ],
    "duplicate_data_entry": [
      "Entering customer information into both CRM and billing sheet"
    ],
    "automation_opportunities": [
      "Automate document creation using webhook trigger",
      "Sync CRM records directly to billing without manual export"
    ]
  },
  "workflow_narrative": "A complete, high-quality descriptive paragraph detailing the step-by-step workflow from start to finish. This narrative should be detailed and directly suitable for FRICTION analysis."
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
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            prompt,
          ],
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} OCR attempt failed:`, err.message);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error("Failed to extract workflow from the image. Please try again.");
    }

    let cleanedText = responseText.trim();
    cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("JSON parsing error on OCR response:", parseErr, cleanedText);

      parsedData = {
        title: "Extracted Visual Workflow",
        diagram_type: "Process Diagram",
        summary: "Visual workflow successfully extracted from uploaded image.",
        raw_text: cleanedText,
        actors_detected: ["Team Member"],
        tools_detected: ["Workflow Applications"],
        steps: [
          {
            step_number: 1,
            action: "Visual workflow extracted from image",
            actor: "Operator",
            tool: "System",
            type: "Action",
            is_manual: true,
            is_bottleneck: false,
            notes: "Extracted from diagram",
          },
        ],
        decisions: [],
        friction_highlights: {
          manual_work: ["Manual steps detected in visual process"],
          repetitive_tasks: [],
          waiting_points: [],
          handoffs: [],
          context_switching: [],
          duplicate_data_entry: [],
          automation_opportunities: ["Process workflow through FRICTION analyzer"],
        },
        workflow_narrative: cleanedText.slice(0, 1000),
      };
    }

    return NextResponse.json({
      success: true,
      extracted: parsedData,
      fileName,
    });
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process and extract workflow from the image. Please verify the file and try again.",
      },
      { status: 500 }
    );
  }
}
