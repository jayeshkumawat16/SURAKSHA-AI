"""Pydantic schemas for request and response validation."""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, constr


class AssistantAnalyzeRequest(BaseModel):
    report: constr(min_length=1, max_length=1000) = Field(
        ...,
        description="User description of the unfolding emergency situation (max 1000 chars)."
    )
    previous_hazard: Optional[str] = Field(
        default=None,
        description="Hazard type identified in a previous turn if updating situation."
    )
    is_situation_update: bool = Field(
        default=False,
        description="Whether this represents changed conditions (e.g., rising water, blocked stairs)."
    )
    force_mode: Optional[Literal["auto", "gemini", "offline"]] = Field(
        default="auto",
        description="Requested AI mode."
    )


class AssistantAnalyzeResponse(BaseModel):
    hazard: str
    urgency: Literal["immediate", "high", "moderate", "low"]
    summary: str
    immediate_actions: List[str]
    next_actions: List[str]
    avoid_actions: List[str]
    contact_emergency_services: bool
    uncertainty: str
    follow_up_questions: List[str]
    source_mode: Literal["gemini", "local_fallback", "demo"]
    safety_disclaimer: str


class PublicConfigResponse(BaseModel):
    gemini_configured: bool
    gemini_model: str
    server_time: str
    version: str
    environment: str
    offline_engine_available: bool = True


class GeminiTestResponse(BaseModel):
    success: bool
    message: str
    model: str
    latency_ms: Optional[float] = None


class AlertItem(BaseModel):
    id: str
    title: str
    hazard: str
    severity: Literal["critical", "severe", "moderate", "minor", "unknown"]
    affected_area: str
    source_authority: str
    issue_time: str
    expiry_time: Optional[str] = None
    source_url: Optional[str] = None
    status: Literal["active", "updated", "expired", "test"]
    provenance: Literal["AUTHORITATIVE_SOURCE", "DEMO_NOT_VERIFIED", "UNVERIFIED_OBSERVATION"]
    description: str
    instruction: Optional[str] = None


class ResourceItem(BaseModel):
    id: str
    name: str
    category: Literal["hospital", "shelter", "food_water", "relief_center", "supplies", "emergency_service"]
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    operating_status: Literal["open", "limited", "unknown"]
    source: str
    last_verified: str
    provenance: Literal["OFFICIAL_DIRECTORY", "DEMO_NOT_VERIFIED"]
    notes: Optional[str] = None
