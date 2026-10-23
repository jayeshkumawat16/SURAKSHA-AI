import * as Network from "expo-network";
import { getJson } from "./api";
import { getSetting, setSetting, SETTING_KEYS } from "../storage/settingsRepository";
import { PublicBackendConfig } from "../types";

export interface ConnectivityStatus {
  isDeviceOnline: boolean;
  isBackendReachable: boolean;
  isManualOffline: boolean;
  geminiConfigured: boolean;
  geminiModel?: string;
  lastSyncFormatted: string;
}

export async function isManualOffline(): Promise<boolean> {
  const val = await getSetting(SETTING_KEYS.IS_MANUAL_OFFLINE, "false");
  return val === "true";
}

export async function setManualOffline(enabled: boolean): Promise<void> {
  await setSetting(SETTING_KEYS.IS_MANUAL_OFFLINE, enabled ? "true" : "false");
}

export async function checkDeviceNetwork(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!(state.isConnected && state.isInternetReachable !== false);
  } catch (e) {
    // If running in environment without expo-network native support
    return true;
  }
}

export async function checkBackendReachability(): Promise<{
  reachable: boolean;
  geminiConfigured: boolean;
  geminiModel: string;
}> {
  try {
    const config = await getJson<PublicBackendConfig>("/api/config/public", 4000);
    const now = new Date().toISOString();
    await setSetting(SETTING_KEYS.LAST_SYNC, now);
    return {
      reachable: true,
      geminiConfigured: config.gemini_configured,
      geminiModel: config.gemini_model || "gemini-2.5-flash"
    };
  } catch (e) {
    return {
      reachable: false,
      geminiConfigured: false,
      geminiModel: "Offline safety engine active"
    };
  }
}

export function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return "Never synced";
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 0) return "Just now";
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return "Unknown";
  }
}
