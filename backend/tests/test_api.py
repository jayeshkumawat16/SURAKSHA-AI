"""Unit and integration tests for FastAPI backend endpoints."""
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "SURAKSHA AI Backend"
    assert "version" in data
    assert "gemini_configured" in data


def test_public_config_never_exposes_key():
    response = client.get("/api/config/public")
    assert response.status_code == 200
    data = response.json()
    # Ensure sensitive terms are absent from keys and values
    for k, v in data.items():
        assert "key" not in k.lower() or k == "gemini_configured"
        if isinstance(v, str):
            assert "AIza" not in v  # Typical Google API key prefix
            assert settings.GEMINI_API_KEY is None or settings.GEMINI_API_KEY not in v
    assert "gemini_model" in data
    assert "offline_engine_available" in data
    assert data["offline_engine_available"] is True


def test_gemini_test_endpoint_unconfigured():
    # In test environment, GEMINI_API_KEY is not configured
    response = client.post("/api/gemini/test")
    assert response.status_code == 200
    data = response.json()
    # Should safely report unconfigured or rate limited, never crash or leak key
    assert "success" in data
    assert "message" in data
    assert "model" in data


def test_assistant_analyze_offline_mode():
    payload = {
        "report": "Earthquake indoors, shelves falling down",
        "force_mode": "offline"
    }
    response = client.post("/api/assistant/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["source_mode"] == "local_fallback"
    assert data["hazard"] == "Earthquake"
    assert data["urgency"] == "immediate"
    assert len(data["immediate_actions"]) > 0
    assert "DROP" in data["immediate_actions"][0]


def test_assistant_analyze_auto_fallback_when_unconfigured():
    payload = {
        "report": "Flood water entering kitchen from street",
        "force_mode": "auto"
    }
    response = client.post("/api/assistant/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    # With unconfigured key in auto mode, it should transparently fall back
    assert data["source_mode"] == "local_fallback"
    assert data["hazard"] == "Flooding"


def test_assistant_analyze_gemini_mode_fails_safely_when_unconfigured():
    payload = {
        "report": "Fire alarm sounding",
        "force_mode": "gemini"
    }
    # When key is not configured and user requested gemini mode, return informative 400
    response = client.post("/api/assistant/analyze", json=payload)
    assert response.status_code == 400
    assert "GEMINI_API_KEY is not configured" in response.json()["detail"]


def test_assistant_analyze_oversized_input():
    payload = {
        "report": "A" * 1005,  # Exceeds max length of 1000
        "force_mode": "auto"
    }
    response = client.post("/api/assistant/analyze", json=payload)
    assert response.status_code == 422  # Validation error from Pydantic


def test_assistant_analyze_empty_input():
    payload = {
        "report": "",
        "force_mode": "auto"
    }
    response = client.post("/api/assistant/analyze", json=payload)
    assert response.status_code == 422


def test_alerts_endpoint_provenance_labels():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)
    assert len(alerts) > 0
    for a in alerts:
        assert a["provenance"] in ["AUTHORITATIVE_SOURCE", "DEMO_NOT_VERIFIED", "UNVERIFIED_OBSERVATION"]
        assert "DEMO" in a["title"] or a["provenance"] == "AUTHORITATIVE_SOURCE"
        assert "hazard" in a
        assert "severity" in a
        assert "status" in a


def test_resources_endpoint_and_detail():
    response = client.get("/api/resources")
    assert response.status_code == 200
    resources = response.json()
    assert isinstance(resources, list)
    assert len(resources) > 0

    first_item = resources[0]
    assert first_item["provenance"] == "DEMO_NOT_VERIFIED"
    assert "latitude" in first_item
    assert "longitude" in first_item

    # Detail query
    res_id = first_item["id"]
    detail_res = client.get(f"/api/resources/{res_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == first_item["name"]

    # Filter query
    hospital_res = client.get("/api/resources?category=hospital")
    assert hospital_res.status_code == 200
    for item in hospital_res.json():
        assert item["category"] == "hospital"


def test_resources_not_found():
    response = client.get("/api/resources/non-existent-999")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_ai_service_malformed_json_fallback():
    """Verifies that if Gemini returns non-JSON or garbled text, it gracefully falls back in auto mode."""
    from app.ai_service import analyze_emergency_situation
    from app.schemas import AssistantAnalyzeRequest

    req = AssistantAnalyzeRequest(
        report="Violent earthquake shaking everything",
        force_mode="auto"
    )

    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyValidDummyKeyForTest123"):
        with patch("google.genai.Client") as mock_client:
            mock_instance = MagicMock()
            mock_instance.models.generate_content.return_value = MagicMock(text="THIS IS NOT VALID JSON {garbled: text")
            mock_client.return_value = mock_instance

            # Call should not crash, but return local fallback
            res = await analyze_emergency_situation(req)
            assert res.source_mode == "local_fallback"
            assert res.hazard == "Earthquake"


@pytest.mark.anyio
async def test_ai_service_timeout_fallback():
    """Verifies that if Gemini call times out, auto mode returns local fallback."""
    from app.ai_service import analyze_emergency_situation
    from app.schemas import AssistantAnalyzeRequest

    req = AssistantAnalyzeRequest(
        report="Fire and dense smoke trapped in stairwell",
        force_mode="auto"
    )

    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyValidDummyKeyForTest123"):
        with patch("google.genai.Client") as mock_client:
            mock_instance = MagicMock()
            mock_instance.models.generate_content.side_effect = TimeoutError("API call timed out")
            mock_client.return_value = mock_instance

            res = await analyze_emergency_situation(req)
            assert res.source_mode == "local_fallback"
            assert res.hazard == "Fire & Smoke"


