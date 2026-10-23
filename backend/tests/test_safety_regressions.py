"""Regression tests for hazard classification and situation-update continuity.

These guard against two confirmed bugs in the offline safety engine:
1. Word-boundary regexes matched only exact keywords, so common real-world phrasings such as
   "flooding", "flooded", "flames" or "earthquakes" fell through to the generic 'unknown' guidance.
2. `previous_hazard` was compared against internal keys, but the mobile app sends back the
   display label from the previous response (e.g. "Flooding"), so hazard continuity was lost.
"""
from app.safety_rules import classify_hazard, evaluate_offline_safety_plan


def test_classifier_handles_inflected_forms():
    cases = {
        "The streets are flooding and water is entering my house": "flood",
        "Our area got flooded last night": "flood",
        "My house is inundated": "flood",
        "The basement is submerged": "flood",
        "The river is overflowing": "flood",
        "Waters are rising quickly": "flood",
        "Earthquakes keep happening": "earthquake",
        "There are flames in the kitchen": "fire",
        "Cyclones are forecast for tonight": "cyclone",
    }
    for text, expected in cases.items():
        assert classify_hazard(text) == expected, f"{text!r} -> {classify_hazard(text)} (expected {expected})"


def test_classifier_keeps_existing_behaviour():
    assert classify_hazard("Flood water rising fast on ground floor") == "flood"
    assert classify_hazard("Smell gas leak and fire alarm ringing") == "fire"
    assert classify_hazard("Something strange happened nearby") == "unknown"
    # a plain burn injury must NOT be widened into the fire-evacuation protocol by this fix
    assert classify_hazard("My son burned his arm with hot oil") == "unknown"


def test_previous_hazard_accepts_display_labels():
    for label, expected in [
        ("Flooding", "Flooding"),
        ("Fire & Smoke", "Fire & Smoke"),
        ("Earthquake", "Earthquake"),
        ("Cyclone / Severe Storm", "Cyclone / Severe Storm"),
        ("Medical Emergency", "Medical Emergency"),
        ("flood", "Flooding"),
    ]:
        res = evaluate_offline_safety_plan(
            report="It is getting worse, please help",
            previous_hazard=label,
            is_situation_update=True,
        )
        assert res.hazard == expected, f"previous_hazard={label!r} -> {res.hazard!r}"
