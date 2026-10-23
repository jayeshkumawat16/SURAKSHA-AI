import { postJson } from "./api";
import { getAIMode } from "../storage/settingsRepository";
import { isManualOffline } from "./connectivity";
import { getOfflineSafetyGuidance } from "../data/emergencyGuides";
import { AssistantRequest, AssistantResponse } from "../types";

export interface AssistantAnalysisResult {
  success: boolean;
  data?: AssistantResponse;
  error?: string;
  sourceMode: "gemini" | "local_fallback" | "offline_manual";
  canFallbackToOffline?: boolean;
}

export async function requestEmergencyAnalysis(
  req: AssistantRequest
): Promise<AssistantAnalysisResult> {
  // Check if manual offline mode is enabled
  const manualOffline = await isManualOffline();
  if (manualOffline || req.force_mode === "offline") {
    const offlineResult = getOfflineSafetyGuidance(
      req.report,
      req.previous_hazard,
      req.is_situation_update
    );
    return {
      success: true,
      data: {
        ...offlineResult,
        source_mode: "local_fallback"
      },
      sourceMode: "offline_manual"
    };
  }

  const selectedMode = req.force_mode || (await getAIMode());

  if (selectedMode === "offline") {
    const offlineResult = getOfflineSafetyGuidance(
      req.report,
      req.previous_hazard,
      req.is_situation_update
    );
    return {
      success: true,
      data: offlineResult,
      sourceMode: "offline_manual"
    };
  }

  // Attempt backend API call
  try {
    const response = await postJson<AssistantResponse>(
      "/api/assistant/analyze",
      {
        report: req.report,
        previous_hazard: req.previous_hazard,
        is_situation_update: !!req.is_situation_update,
        force_mode: selectedMode
      },
      selectedMode === "gemini" ? 12000 : 8000
    );

    return {
      success: true,
      data: response,
      sourceMode: response.source_mode as any
    };
  } catch (error: any) {
    // If user explicitly chose Gemini-only, do not silently swallow the error;
    // expose the error message and give option to switch to offline
    if (selectedMode === "gemini") {
      return {
        success: false,
        error: error.message || "Failed to reach Gemini AI backend service.",
        sourceMode: "gemini",
        canFallbackToOffline: true
      };
    }

    // In 'auto' mode, fall back seamlessly to local deterministic safety guidance
    const fallbackGuidance = getOfflineSafetyGuidance(
      req.report,
      req.previous_hazard,
      req.is_situation_update
    );

    return {
      success: true,
      data: {
        ...fallbackGuidance,
        source_mode: "local_fallback"
      },
      sourceMode: "local_fallback"
    };
  }
}
