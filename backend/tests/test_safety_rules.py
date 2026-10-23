"""Unit tests for offline deterministic safety rules."""
import pytest
from app.safety_rules import classify_hazard, evaluate_offline_safety_plan


def test_classify_hazard_earthquake():
    assert classify_hazard("Strong earthquake shaking the walls") == "earthquake"
    assert classify_hazard("Felt tremor and aftershock indoors") == "earthquake"


def test_classify_hazard_flood():
    assert classify_hazard("Flood water rising fast on ground floor") == "flood"
    assert classify_hazard("Street is submerged in flash flood") == "flood"


def test_classify_hazard_fire():
    assert classify_hazard("Thick black smoke and fire in stairwell") == "fire"
    assert classify_hazard("Smell gas leak and fire alarm ringing") == "fire"


def test_classify_hazard_cyclone():
    assert classify_hazard("Cyclone winds ripping tin roofs outside") == "cyclone"
    assert classify_hazard("Severe hurricane storm surge warning") == "cyclone"


def test_classify_hazard_medical():
    assert classify_hazard("Person is unconscious and not breathing, need CPR") == "medical"
    assert classify_hazard("Severe bleeding and compound fracture from fall") == "medical"


def test_classify_hazard_unknown():
    assert classify_hazard("Something strange happened nearby") == "unknown"


def test_evaluate_offline_safety_plan_earthquake():
    res = evaluate_offline_safety_plan("Violent earthquake shaking ground")
    assert res.hazard == "Earthquake"
    assert res.urgency == "immediate"
    assert res.source_mode == "local_fallback"
    assert any("DROP" in action for action in res.immediate_actions)
    assert any("elevator" in action.lower() for action in res.avoid_actions)
    assert res.contact_emergency_services is True


def test_evaluate_offline_safety_plan_flood_situation_update():
    res = evaluate_offline_safety_plan(
        report="Rising water is now at waist level",
        previous_hazard="flood",
        is_situation_update=True
    )
    assert res.hazard == "Flooding"
    assert "SITUATION UPDATED" in res.summary
    assert any("URGENT UPDATE" in action for action in res.immediate_actions)


def test_evaluate_offline_safety_plan_fire_trapped_update():
    res = evaluate_offline_safety_plan(
        report="Exit blocked by dense smoke",
        previous_hazard="fire",
        is_situation_update=True
    )
    assert res.hazard == "Fire & Smoke"
    assert any("blocked" in action.lower() or "smoke" in action.lower() for action in res.immediate_actions)
