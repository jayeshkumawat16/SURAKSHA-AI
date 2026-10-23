import { getJson } from "./api";
import { isManualOffline } from "./connectivity";
import { AlertItem } from "../types";

export const LOCAL_FALLBACK_ALERTS: AlertItem[] = [
  {
    id: "offline-alert-001",
    title: "[DEMO] Heavy Rainfall & Flash Flood Advisory",
    hazard: "Flood / Heavy Rain",
    severity: "severe",
    affected_area: "Coastal Lowland District (Demo Sector 4)",
    source_authority: "State Disaster Management Authority (Demo Feed)",
    issue_time: new Date().toISOString(),
    expiry_time: null,
    source_url: "https://sachet.ndma.gov.in",
    status: "active",
    provenance: "DEMO_NOT_VERIFIED",
    description: "DEMO ALERT ONLY: Low-lying roads may experience rapid water logging. Exercise extreme caution.",
    instruction: "Stay clear of drainage canals, culverts, and underpasses. Follow radio broadcasts."
  },
  {
    id: "offline-alert-002",
    title: "[DEMO] Seismic Tremor Advisory - Magnitude 4.2",
    hazard: "Earthquake",
    severity: "moderate",
    affected_area: "Northern Himalayan Belt (Demo Region)",
    source_authority: "National Centre for Seismology (Demo Feed)",
    issue_time: new Date().toISOString(),
    expiry_time: null,
    source_url: "https://seismo.gov.in",
    status: "updated",
    provenance: "DEMO_NOT_VERIFIED",
    description: "DEMO ALERT ONLY: Mild aftershocks recorded. Structural engineers inspecting transit flyovers.",
    instruction: "Check residential gas and power connections. Practice Drop, Cover, Hold On if shaking resumes."
  }
];

export async function fetchAlerts(): Promise<{
  alerts: AlertItem[];
  isLive: boolean;
  error?: string;
}> {
  const manualOffline = await isManualOffline();
  if (manualOffline) {
    return {
      alerts: LOCAL_FALLBACK_ALERTS,
      isLive: false
    };
  }

  try {
    const data = await getJson<AlertItem[]>("/api/alerts", 5000);
    return {
      alerts: data,
      isLive: true
    };
  } catch (error: any) {
    return {
      alerts: LOCAL_FALLBACK_ALERTS,
      isLive: false,
      error: "Live alert feed unreachable. Showing verified offline demonstration records."
    };
  }
}
