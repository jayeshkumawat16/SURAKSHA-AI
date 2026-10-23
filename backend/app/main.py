"""FastAPI Application entry point for SURAKSHA AI Disaster Safety backend."""
from datetime import datetime, timezone
import logging
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.schemas import (
    AssistantAnalyzeRequest,
    AssistantAnalyzeResponse,
    PublicConfigResponse,
    GeminiTestResponse,
    AlertItem,
    ResourceItem,
)
from app.ai_service import analyze_emergency_situation, test_gemini_connection
from app.alerts import get_current_alerts
from app.resources import list_resources, get_resource_by_id

# Configure restrained logging to avoid leaking sensitive user data
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("suraksha.main")

app = FastAPI(
    title=settings.APP_NAME,
    description="Emergency disaster safety and situational awareness backend for SURAKSHA AI.",
    version=__version__,
)

# CORS configuration
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")]
if "*" in origins:
    allow_origins = ["*"]
else:
    allow_origins = origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["System"])
async def health_check():
    """Health check endpoint to verify backend operational readiness."""
    return {
        "status": "healthy",
        "service": "SURAKSHA AI Backend",
        "version": __version__,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_configured": settings.is_gemini_configured
    }


@app.get("/api/config/public", response_model=PublicConfigResponse, tags=["System"])
async def get_public_config():
    """
    Public configuration metadata for the mobile client.
    STRICT SECURITY RULE: Never exposes GEMINI_API_KEY or server credentials.
    """
    return PublicConfigResponse(
        gemini_configured=settings.is_gemini_configured,
        gemini_model=settings.GEMINI_MODEL,
        server_time=datetime.now(timezone.utc).isoformat(),
        version=__version__,
        environment=settings.APP_ENV,
        offline_engine_available=True
    )


@app.post("/api/gemini/test", response_model=GeminiTestResponse, tags=["AI"])
async def test_gemini_endpoint():
    """
    Protected connection test endpoint.
    Safely tests whether Gemini responds without exposing secrets or keys to the mobile app.
    Rate limited to prevent abuse.
    """
    result = await test_gemini_connection()
    return result


@app.post("/api/assistant/analyze", response_model=AssistantAnalyzeResponse, tags=["AI"])
async def analyze_emergency(request: AssistantAnalyzeRequest):
    """
    Analyzes emergency report.
    Uses Gemini when configured, with automatic deterministic fallback to reviewed safety rules.
    """
    try:
        # Anonymized log entry: never log personal names, precise addresses, or numbers
        logger.info(f"Received emergency analysis request (length={len(request.report)}, mode={request.force_mode})")
        response = await analyze_emergency_situation(request)
        return response
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except RuntimeError as run_err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(run_err)
        )
    except Exception as exc:
        logger.error(f"Unexpected error in assistant endpoint: {type(exc).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal safety engine error. Please use offline guides."
        )


@app.get("/api/alerts", response_model=List[AlertItem], tags=["Alerts"])
async def get_alerts():
    """Returns active disaster alert advisories with explicit provenance markers."""
    return await get_current_alerts()


@app.get("/api/resources", response_model=List[ResourceItem], tags=["Resources"])
async def get_resources(category: Optional[str] = Query(None, description="Category filter")):
    """Returns emergency lifeline resources (hospitals, shelters, water, relief)."""
    return list_resources(category)


@app.get("/api/resources/{resource_id}", response_model=ResourceItem, tags=["Resources"])
async def get_resource_detail(resource_id: str):
    """Returns detail for a single lifeline resource."""
    item = get_resource_by_id(resource_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource '{resource_id}' not found."
        )
    return item
