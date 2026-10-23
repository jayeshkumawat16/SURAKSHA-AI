import { getDatabase, memoryStore } from "./database";
import { AIMode } from "../types";

export const SETTING_KEYS = {
  AI_MODE: "ai_mode",
  API_BASE_URL: "api_base_url",
  LAST_SYNC: "last_sync_time",
  IS_MANUAL_OFFLINE: "is_manual_offline",
  LANGUAGE: "app_language"
};

export async function getSetting(key: string, defaultValue: string = ""): Promise<string> {
  const db = await getDatabase();
  if (db) {
    try {
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM app_settings WHERE key = ?;",
        [key]
      );
      if (row && row.value !== undefined) {
        return row.value;
      }
    } catch (e) {
      console.warn("DB read error in getSetting:", e);
    }
  }

  if (memoryStore.app_settings && memoryStore.app_settings[key] !== undefined) {
    return memoryStore.app_settings[key];
  }
  return defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.runAsync(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);",
        [key, value]
      );
      return;
    } catch (e) {
      console.warn("DB write error in setSetting:", e);
    }
  }

  if (!memoryStore.app_settings) memoryStore.app_settings = {};
  memoryStore.app_settings[key] = value;
}

export async function getAIMode(): Promise<AIMode> {
  const mode = await getSetting(SETTING_KEYS.AI_MODE, "auto");
  if (mode === "gemini" || mode === "offline") return mode;
  return "auto";
}

export async function setAIMode(mode: AIMode): Promise<void> {
  await setSetting(SETTING_KEYS.AI_MODE, mode);
}

export async function getApiBaseUrl(): Promise<string> {
  // Expo public env variable or default localhost / lan
  const defaultUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  return await getSetting(SETTING_KEYS.API_BASE_URL, defaultUrl);
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await setSetting(SETTING_KEYS.API_BASE_URL, url);
}

export async function clearAllPersonalData(): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.runAsync("DELETE FROM app_settings;");
      await db.runAsync("DELETE FROM trusted_contacts;");
      await db.runAsync("DELETE FROM cached_sos;");
      return;
    } catch (e) {
      console.warn("DB clear error in clearAllPersonalData:", e);
    }
  }

  memoryStore.app_settings = {};
  memoryStore.trusted_contacts = {};
  memoryStore.cached_sos = {};
}
