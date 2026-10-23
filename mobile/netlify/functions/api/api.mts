// SURAKSHA AI backend API, ported from the FastAPI service in backend/app so it runs on Netlify.
// Gemini credentials are injected server-side by Netlify AI Gateway and never reach the client.
import type { Config } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";
import { getOfflineSafetyGuidance, SAFETY_DISCLAIMER } from "../../../src/data/emergencyGuides";
import { DEMO_ALERTS, DEMO_RESOURCES } from "./demoData";

const VERSION = "1.0.0";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_TIMEOUT_MS = 11000;
const URGENCIES = ["immediate", "high", "moderate", "low"];

const SYSTEM_INSTRUCTION = `
You are the SURAKSHA AI Emergency Assistant, designed for disaster safety in India and worldwide.
Your goal is to provide calm, clear, actionable, life-saving guidance during emergencies.

CRITICAL RULES:
1. PRIORITISE LIFE SAFETY: Focus first on immediate survival actions.
2. DO NOT INVENT: Never fabricate official alerts, weather warnings, or rescue team status.
3. NO FALSE RESCUE CLAIMS: Never claim rescue teams, NDRF, or police are en route unless official confirmation exists.
4. NO GUARANTEED ESCAPE ROUTES: Never state a specific route or place is 100% safe.
5. DO NOT OVERRIDE REVIEWED SAFETY RULES:
   - Earthquake indoors: Drop, cover, hold on. Do NOT run outside while shaking. Do NOT use elevators.
   - Flood: Avoid walking/driving through floodwaters. Move to higher ground. Turn off utilities if safe.
   - Fire: Crawl under smoke. Feel doors before opening. Never use elevators. Do not re-enter.
   - Medical: Dial 112. Only provide basic recognized first aid/CPR.
6. STATE UNCERTAINTY: Clearly communicate unknown risks.
7. RECOMMEND EMERGENCY SERVICES: Explicitly instruct to call 112 (India) when life is in immediate danger.
8. Respond ONLY with valid JSON matching the exact schema below.

JSON SCHEMA EXPECTED:
{
  "hazard": "string (e.g. Earthquake, Flood, Fire, Cyclone, Medical Emergency, General)",
  "urgency": "immediate | high | moderate | low",
  "summary": "concise 1-2 sentence overview of the immediate danger and posture",
  "immediate_actions": ["action 1", "action 2", "action 3"],
  "next_actions": ["subsequent step 1", "subsequent step 2"],
  "avoid_actions": ["dangerous action 1 to avoid", "dangerous action 2 to avoid"],
  "contact_emergency_services": true/false,
  "uncertainty": "concise statement about unknown parameters or variables",
  "follow_up_questions": ["question 1 to clarify situation", "question 2"]
}
`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

function error(detail: string, status: number): Response {
  return json({ detail }, status);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("TimeoutError")), ms)),
  ]);
}

function asStringList(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.map(String) : fallback;
}

async function analyzeWithGemini(report: string, previousHazard: string | undefined, isUpdate: boolean) {
  const ai = new GoogleGenAI({});
  let prompt = `Emergency situation report: ${report}\n`;
  if (isUpdate) {
    prompt += `Note: This is an updated situation report. Previous hazard was: ${previousHazard || "unspecified"}. Highlight what changed.`;
  }

  const response = await withTimeout(
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
    GEMINI_TIMEOUT_MS
  );

  const cleaned = (response.text || "")
    .trim()
    .replace(/^```(?:json)?/, "")
    .replace(/```$/, "")
    .trim();
  const data = JSON.parse(cleaned);

  return {
    hazard: String(data.hazard ?? "Emergency Hazard"),
    urgency: URGENCIES.includes(data.urgency) ? data.urgency : "high",
    summary: String(data.summary ?? "Emergency response instructions generated."),
    immediate_actions: asStringList(data.immediate_actions, ["Ensure personal safety", "Dial 112 if in danger"]),
    next_actions: asStringList(data.next_actions, ["Monitor official advisories"]),
    avoid_actions: asStringList(data.avoid_actions, ["Do not take unnecessary risks"]),
    contact_emergency_services: data.contact_emergency_services !== false,
    uncertainty: String(data.uncertainty ?? "Field situation changes rapidly."),
    follow_up_questions: asStringList(data.follow_up_questions, []),
    source_mode: "gemini",
    safety_disclaimer: SAFETY_DISCLAIMER,
  };
}

async function handleAnalyze(req: Request): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return error("Request body must be valid JSON.", 422);
  }

  const report = typeof body?.report === "string" ? body.report : "";
  if (report.length < 1 || report.length > 1000) {
    return error("report must be between 1 and 1000 characters.", 422);
  }
  const previousHazard = typeof body.previous_hazard === "string" ? body.previous_hazard : undefined;
  const isUpdate = !!body.is_situation_update;
  const mode = ["auto", "gemini", "offline"].includes(body.force_mode) ? body.force_mode : "auto";

  // Anonymized log entry: never log the report contents
  console.log(`Emergency analysis request (length=${report.length}, mode=${mode})`);

  const offline = () => json(getOfflineSafetyGuidance(report, previousHazard, isUpdate));
  if (mode === "offline") return offline();

  try {
    return json(await analyzeWithGemini(report, previousHazard, isUpdate));
  } catch (e: any) {
    console.warn(`Gemini invocation failed: ${e?.name || "Error"}`);
    if (mode === "gemini") {
      return error("Gemini AI service error. Switch to Offline mode or try again later.", 502);
    }
    return offline();
  }
}

async function handleGeminiTest(): Promise<Response> {
  try {
    const ai = new GoogleGenAI({});
    const start = Date.now();
    await withTimeout(
      ai.models.generateContent({ model: GEMINI_MODEL, contents: "Respond with single word: OK" }),
      GEMINI_TIMEOUT_MS
    );
    return json({
      success: true,
      message: "Successfully verified connection to Gemini API.",
      model: GEMINI_MODEL,
      latency_ms: Date.now() - start,
    });
  } catch (e: any) {
    return json({
      success: false,
      message: `Gemini test failed (${e?.name || "Error"}): Service unreachable.`,
      model: GEMINI_MODEL,
    });
  }
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "");
  const now = new Date().toISOString();

  if (req.method === "GET") {
    if (path === "/api/health") {
      return json({ status: "healthy", service: "SURAKSHA AI Backend", version: VERSION, timestamp: now, gemini_configured: true });
    }
    if (path === "/api/config/public") {
      return json({
        gemini_configured: true,
        gemini_model: GEMINI_MODEL,
        server_time: now,
        version: VERSION,
        environment: process.env.CONTEXT || "production",
        offline_engine_available: true,
      });
    }
    if (path === "/api/alerts") {
      return json(DEMO_ALERTS.map((a) => ({ ...a, issue_time: now })));
    }
    if (path === "/api/resources") {
      const category = url.searchParams.get("category")?.toLowerCase();
      const items = !category || category === "all" ? DEMO_RESOURCES : DEMO_RESOURCES.filter((r) => r.category === category);
      return json(items);
    }
    const match = path.match(/^\/api\/resources\/([^/]+)$/);
    if (match) {
      const item = DEMO_RESOURCES.find((r) => r.id === decodeURIComponent(match[1]));
      return item ? json(item) : error(`Resource '${match[1]}' not found.`, 404);
    }
  }

  if (req.method === "POST") {
    if (path === "/api/assistant/analyze") return handleAnalyze(req);
    if (path === "/api/gemini/test") return handleGeminiTest();
  }

  return error("Not Found", 404);
};

export const config: Config = {
  path: "/api/*",
};
