"""Gemini AI service integration with strict safety constraints and offline fallback."""
import json
import logging
import time
from typing import Optional

from app.config import settings
from app.schemas import (
    AssistantAnalyzeRequest,
    AssistantAnalyzeResponse,
    GeminiTestResponse,
)
from app.safety_rules import (
    evaluate_offline_safety_plan,
    SAFETY_DISCLAIMER,
)

logger = logging.getLogger("suraksha.ai")

SYSTEM_INSTRUCTION = """
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
"""

_last_test_time: float = 0.0


def is_rate_limited_test() -> bool:
    """Simple rate-limiter for connection test endpoint."""
    global _last_test_time
    now = time.time()
    if (now - _last_test_time) < settings.RATE_LIMIT_TEST_SECONDS:
        return True
    _last_test_time = now
    return False


async def analyze_emergency_situation(
    req: AssistantAnalyzeRequest
) -> AssistantAnalyzeResponse:
    """
    Analyzes an emergency situation report using Gemini if available and requested,
    falling back to deterministic reviewed safety rules when unavailable.
    """
    # 1. Check if user explicitly demanded offline mode
    if req.force_mode == "offline":
        return evaluate_offline_safety_plan(
            report=req.report,
            previous_hazard=req.previous_hazard,
            is_situation_update=req.is_situation_update
        )

    # 2. If Gemini is not configured
    if not settings.is_gemini_configured:
        if req.force_mode == "gemini":
            raise ValueError(
                "Gemini AI mode was explicitly selected, but GEMINI_API_KEY is not configured in backend/.env. "
                "Please configure a valid key or switch to Automatic / Offline Safety Engine."
            )
        # Automatic fallback
        return evaluate_offline_safety_plan(
            report=req.report,
            previous_hazard=req.previous_hazard,
            is_situation_update=req.is_situation_update
        )

    # 3. Attempt Gemini API call safely
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        prompt_text = f"Emergency situation report: {req.report}\n"
        if req.is_situation_update:
            prompt_text += f"Note: This is an updated situation report. Previous hazard was: {req.previous_hazard or 'unspecified'}. Highlight what changed."

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.2,
            response_mime_type="application/json",
        )

        # Call with timeout
        start_t = time.time()
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt_text,
            config=config,
        )

        raw_text = response.text or ""
        # Strip potential markdown fences if present
        cleaned_text = raw_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[3:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip()

        data = json.loads(cleaned_text)

        # Validate required fields or supply safe defaults
        return AssistantAnalyzeResponse(
            hazard=str(data.get("hazard", "Emergency Hazard")),
            urgency=data.get("urgency", "high") if data.get("urgency") in ["immediate", "high", "moderate", "low"] else "high",
            summary=str(data.get("summary", "Emergency response instructions generated.")),
            immediate_actions=list(data.get("immediate_actions", ["Ensure personal safety", "Dial 112 if in danger"])),
            next_actions=list(data.get("next_actions", ["Monitor official advisories"])),
            avoid_actions=list(data.get("avoid_actions", ["Do not take unnecessary risks"])),
            contact_emergency_services=bool(data.get("contact_emergency_services", True)),
            uncertainty=str(data.get("uncertainty", "Field situation changes rapidly.")),
            follow_up_questions=list(data.get("follow_up_questions", [])),
            source_mode="gemini",
            safety_disclaimer=SAFETY_DISCLAIMER
        )

    except Exception as e:
        logger.warning(f"Gemini API invocation failed or timed out: {type(e).__name__}")
        if req.force_mode == "gemini":
            raise RuntimeError(
                f"Gemini AI service error: {type(e).__name__}. Switch to Offline mode or try again later."
            )
        # Automatic graceful fallback
        fallback_resp = evaluate_offline_safety_plan(
            report=req.report,
            previous_hazard=req.previous_hazard,
            is_situation_update=req.is_situation_update
        )
        return fallback_resp


async def test_gemini_connection() -> GeminiTestResponse:
    """
    Safely tests backend connectivity to Gemini API.
    Never exposes credentials or keys to caller.
    """
    if is_rate_limited_test():
        return GeminiTestResponse(
            success=False,
            message="Rate limit: Please wait a few seconds before testing again.",
            model=settings.GEMINI_MODEL
        )

    if not settings.is_gemini_configured:
        return GeminiTestResponse(
            success=False,
            message="GEMINI_API_KEY is not configured or contains placeholder text in backend/.env",
            model=settings.GEMINI_MODEL
        )

    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        start_time = time.time()

        # Send a tiny ping prompt
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents="Respond with single word: OK",
        )
        elapsed_ms = round((time.time() - start_time) * 1000.0, 1)

        if response.text and "OK" in response.text.upper():
            return GeminiTestResponse(
                success=True,
                message="Successfully verified connection to Gemini API.",
                model=settings.GEMINI_MODEL,
                latency_ms=elapsed_ms
            )
        return GeminiTestResponse(
            success=True,
            message="Received response from Gemini API.",
            model=settings.GEMINI_MODEL,
            latency_ms=elapsed_ms
        )
    except Exception as exc:
        return GeminiTestResponse(
            success=False,
            message=f"Gemini test failed ({type(exc).__name__}): Service unreachable or key invalid.",
            model=settings.GEMINI_MODEL
        )
