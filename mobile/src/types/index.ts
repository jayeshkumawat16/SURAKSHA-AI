export type HazardType =
  | "earthquake"
  | "flood"
  | "fire"
  | "cyclone"
  | "medical"
  | "unknown";

export type UrgencyLevel = "immediate" | "high" | "moderate" | "low";

export type AIMode = "auto" | "gemini" | "offline";

export type SourceMode = "gemini" | "local_fallback" | "demo";

export interface AssistantResponse {
  hazard: string;
  urgency: UrgencyLevel;
  summary: string;
  immediate_actions: string[];
  next_actions: string[];
  avoid_actions: string[];
  contact_emergency_services: boolean;
  uncertainty: string;
  follow_up_questions: string[];
  source_mode: SourceMode;
  safety_disclaimer: string;
}

export interface AssistantRequest {
  report: string;
  previous_hazard?: string;
  is_situation_update?: boolean;
  force_mode?: AIMode;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
  created_at: string;
}

export interface EmergencyLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: number;
  addressDescription?: string;
}

export interface PreparedSOSMessage {
  text: string;
  location?: EmergencyLocation | null;
  manualLocation?: string;
  timestamp: string;
  mapUrl?: string;
}

export interface AlertItem {
  id: string;
  title: string;
  hazard: string;
  severity: "critical" | "severe" | "moderate" | "minor" | "unknown";
  affected_area: string;
  source_authority: string;
  issue_time: string;
  expiry_time?: string | null;
  source_url?: string | null;
  status: "active" | "updated" | "expired" | "test";
  provenance: "AUTHORITATIVE_SOURCE" | "DEMO_NOT_VERIFIED" | "UNVERIFIED_OBSERVATION";
  description: string;
  instruction?: string | null;
}

export type ResourceCategory =
  | "hospital"
  | "shelter"
  | "food_water"
  | "relief_center"
  | "supplies"
  | "emergency_service";

export interface LifelineResource {
  id: string;
  name: string;
  category: ResourceCategory;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  operating_status: "open" | "limited" | "unknown";
  source: string;
  last_verified: string;
  provenance: "OFFICIAL_DIRECTORY" | "DEMO_NOT_VERIFIED";
  notes?: string | null;
}

export interface EmergencyGuide {
  id: string;
  hazard: HazardType;
  title: string;
  shortSummary: string;
  immediateDo: string[];
  immediateAvoid: string[];
  postIncidentSteps: string[];
  emergencyServicesAdvice: string;
  icon: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: "survival" | "medical" | "documents" | "tools" | "custom";
  completed: boolean;
  isCustom?: boolean;
}

export interface PublicBackendConfig {
  gemini_configured: boolean;
  gemini_model: string;
  server_time: string;
  version: string;
  environment: string;
  offline_engine_available: boolean;
}
