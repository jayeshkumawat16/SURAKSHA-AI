import { getApiBaseUrl } from "../storage/settingsRepository";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function fetchWithTimeout(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<Response> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    clearTimeout(id);
    return res;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new ApiError(`Request timed out after ${timeoutMs / 1000}s`, 408);
    }
    throw new ApiError(error.message || "Network request failed");
  }
}

export async function getJson<T>(endpoint: string, timeoutMs?: number): Promise<T> {
  const res = await fetchWithTimeout(endpoint, { method: "GET" }, timeoutMs);
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new ApiError(errorBody || `HTTP ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

export async function postJson<T>(endpoint: string, body: any, timeoutMs?: number): Promise<T> {
  const res = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      body: JSON.stringify(body)
    },
    timeoutMs
  );
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const parsed = await res.json();
      if (parsed.detail) msg = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status);
  }
  return (await res.json()) as T;
}
