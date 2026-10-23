"""Deterministic, reviewed disaster safety rules for offline and fallback execution."""
import re
from typing import Optional
from app.schemas import AssistantAnalyzeResponse

SAFETY_DISCLAIMER = (
    "SURAKSHA AI guidance is for situational awareness and emergency reference. "
    "It is NOT an official alert, legal directive, or medical diagnosis. "
    "Always dial 112 (India) or follow official NDRF/SDMA instructions in immediate danger."
)

OFFLINE_RULES = {
    "earthquake": {
        "hazard": "Earthquake",
        "urgency": "immediate",
        "summary": "Immediate drop, cover, and hold-on protocol is vital during ground tremors.",
        "immediate_actions": [
            "DROP to your hands and knees immediately.",
            "COVER your head and neck under a sturdy table or desk.",
            "HOLD ON to your shelter until violent shaking stops.",
            "Stay away from glass windows, exterior doors, and tall unanchored furniture.",
            "Do NOT use elevators under any circumstances."
        ],
        "next_actions": [
            "Once shaking ceases, carefully inspect your immediate area for gas leaks, electrical sparks, and structural cracks.",
            "Exit the building cautiously via stairs if safe, watching for fallen debris.",
            "Move to an open clearing away from power lines, trees, and buildings.",
            "Tune in to local official emergency broadcasts."
        ],
        "avoid_actions": [
            "Do NOT run outside while tremors are active.",
            "Do NOT use elevators or escalators.",
            "Do NOT light matches, lighters, or switch on appliances until gas leaks are ruled out."
        ],
        "contact_emergency_services": True,
        "uncertainty": "Ground aftershocks may recur without advance warning. Structural damage requires qualified inspection.",
        "follow_up_questions": [
            "Are you currently trapped, injured, or smelling gas?",
            "Are tremors still actively shaking the building?"
        ]
    },
    "flood": {
        "hazard": "Flooding",
        "urgency": "high",
        "summary": "Water level surge or flash flooding demands moving to elevated ground and strict avoidance of moving water.",
        "immediate_actions": [
            "Move immediately to higher ground or upper floors if safe to do so.",
            "Turn off main electricity and gas switches if you can do so safely without standing in water.",
            "Keep emergency grab bag, essential medications, and waterproof phone pouch close."
        ],
        "next_actions": [
            "Monitor official SDMA / IMD weather and evacuation alerts.",
            "If trapped in a building, move to the roof only if necessary; signal for rescue with a bright cloth or whistle.",
            "Drink only bottled, boiled, or purified water to avoid waterborne pathogens."
        ],
        "avoid_actions": [
            "NEVER walk, swim, or drive through moving floodwaters (Turn Around, Don't Drown). 15 cm of moving water can knock you down.",
            "Do NOT touch electrical equipment, switches, or submerged cords while wet.",
            "Do NOT enter basements or low-lying underground parking areas."
        ],
        "contact_emergency_services": True,
        "uncertainty": "Flood cresting times and upstream dam releases depend on regional hydrology.",
        "follow_up_questions": [
            "Is flood water actively rising inside your shelter?",
            "Are roads or ground exits completely submerged?"
        ]
    },
    "fire": {
        "hazard": "Fire & Smoke",
        "urgency": "immediate",
        "summary": "Smoke inhalation and active flame require rapid evacuation or sealing of safe refuge.",
        "immediate_actions": [
            "Evacuate immediately via designated fire exit stairs.",
            "Crawl low under smoke where the air is cleaner and cooler.",
            "Feel doors with the back of your hand before opening; do not open hot doors."
        ],
        "next_actions": [
            "Call 112 / 101 once outside at a safe assembly point.",
            "If trapped in a room: close the door, seal cracks around doors and vents with damp cloth/tape, and open a window slightly to signal rescue.",
            "Wave a brightly colored cloth or flashlight from the window to attract firefighters."
        ],
        "avoid_actions": [
            "NEVER use an elevator during a fire.",
            "Do NOT re-enter a burning building for any belongings or pets.",
            "Do NOT break windows unless strictly necessary, as oxygen feeds the fire."
        ],
        "contact_emergency_services": True,
        "uncertainty": "Fire spread rates vary drastically based on building ventilation and flammable loads.",
        "follow_up_questions": [
            "Is your primary stairway or exit door blocked by flame or smoke?",
            "Is anyone trapped, burned, or experiencing smoke inhalation?"
        ]
    },
    "cyclone": {
        "hazard": "Cyclone / Severe Storm",
        "urgency": "high",
        "summary": "Gale-force winds, flying debris, and storm surge require sturdy internal shelter.",
        "immediate_actions": [
            "Shelter in the strongest part of your home: an interior room, hallway, or bathroom without windows.",
            "Disconnect electrical appliances and shut off gas cylinders.",
            "Anchor or bring indoors all loose outdoor objects, flower pots, and sheetings."
        ],
        "next_actions": [
            "Keep battery-powered radio or offline alerts accessible.",
            "Stay inside even if the wind suddenly calms—you may be in the calm 'eye' of the cyclone, and violent winds will resume from the reverse direction.",
            "Prepare fresh drinking water containers ahead of time."
        ],
        "avoid_actions": [
            "Do NOT stand near exterior glass windows or doors.",
            "Do NOT venture outdoors during the calm eye of the storm.",
            "Do NOT touch downed power cables or fallen trees contacting lines."
        ],
        "contact_emergency_services": True,
        "uncertainty": "Landfall tracking and storm surge heights can deviate as the cyclone approaches coastline.",
        "follow_up_questions": [
            "Are you in a low-lying coastal flood evacuation zone?",
            "Has structural roofing or glass sustained breach?"
        ]
    },
    "medical": {
        "hazard": "Medical Emergency",
        "urgency": "immediate",
        "summary": "Life-threatening medical symptoms require urgent professional dispatch (Dial 112 / 102).",
        "immediate_actions": [
            "Ensure the immediate environment is safe before approaching the patient.",
            "Check responsiveness and breathing: call out and gently tap shoulders.",
            "If unconscious and not breathing normally, begin Hands-Only CPR: push hard and fast in center of chest (100-120 bpm).",
            "For severe bleeding, apply firm direct pressure using a clean cloth or bandage."
        ],
        "next_actions": [
            "Call 112 or local ambulance dispatch immediately; share exact landmark location.",
            "Keep the patient warm and still; do not move someone with suspected spinal or head trauma unless imminent environmental danger exists.",
            "Gather any prescription medications the patient currently takes to hand over to paramedics."
        ],
        "avoid_actions": [
            "Do NOT administer liquids, food, or oral medications to an unconscious or drowsy individual.",
            "Do NOT move injured individuals with potential spinal injury unless life is in danger from fire or collapse.",
            "Do NOT leave an unstable casualty unattended."
        ],
        "contact_emergency_services": True,
        "uncertainty": "Symptom progression requires trained medical evaluation and triage.",
        "follow_up_questions": [
            "Is the patient conscious, breathing, or experiencing heavy bleeding?",
            "Are you in a safe position to initiate first aid or CPR?"
        ]
    },
    "unknown": {
        "hazard": "General Emergency Situation",
        "urgency": "moderate",
        "summary": "Unspecified hazard conditions require cautious situational awareness and verified authoritative advisories.",
        "immediate_actions": [
            "Pause and evaluate immediate physical surroundings for smoke, water, shaking, or structural hazards.",
            "Ensure personal safety and secure trusted family members.",
            "Prepare your emergency grab-bag and charged mobile devices."
        ],
        "next_actions": [
            "Check verified local disaster management authority announcements (NDRF/SDMA).",
            "Dial 112 if you or those around you are in immediate peril.",
            "Keep your location details ready to share with emergency responders."
        ],
        "avoid_actions": [
            "Do NOT act on unverified rumors or forwards circulating on social media.",
            "Do NOT enter unstable structures or waterlogged pathways.",
            "Do NOT block emergency phone lines for non-urgent inquiries."
        ],
        "contact_emergency_services": False,
        "uncertainty": "Hazard parameters are undetermined from current report details.",
        "follow_up_questions": [
            "What specific hazard are you experiencing (earthquake, flood, fire, cyclone, medical)?",
            "Is there immediate danger to life or physical injury?"
        ]
    }
}


def classify_hazard(text: str) -> str:
    """Classifies disaster hazard category from text using regex keywords.

    Patterns match common inflections (flooding, flooded, flames, earthquakes, ...). The earlier
    version wrapped bare stems in \\b...\\b, so "flooding" or "inundated" never matched and fell
    through to the generic 'unknown' guidance.
    """
    lower = text.lower()

    if re.search(r"\b(?:earthquakes?|quakes?|tremors?|shaking|aftershocks?|seismic|ground shaking)\b", lower):
        return "earthquake"
    if re.search(r"\b(?:flood\w*|water level|waters? (?:is |are )?ris(?:ing|e|es)|drowning|overflow\w*|inundat\w*|submerg\w*)\b", lower):
        return "flood"
    if re.search(r"\b(?:fires?|smok(?:e|ing|y)|flames?|flaming|burning|burn|fire alarm|blaz(?:e|es|ing)|gas leaks?|explosions?)\b", lower):
        return "fire"
    if re.search(r"\b(?:cyclones?|hurricanes?|typhoons?|storms?|heavy winds?|gales?|tornad(?:o|oes))\b", lower):
        return "cyclone"
    if re.search(r"\b(?:cpr|unconscious|bleeding|heart attack|chest pain|choking|stroke|fractures?|wounds?|poison\w*|injur(?:y|ies|ed)|breathing)\b", lower):
        return "medical"

    return "unknown"


def _normalize_previous_hazard(previous_hazard: Optional[str]) -> Optional[str]:
    """Maps whatever the client sends back (rule key such as 'flood', or a display label such as
    'Flooding' / 'Fire & Smoke') to an OFFLINE_RULES key. Returns None if it cannot be mapped."""
    if not previous_hazard:
        return None
    prev = previous_hazard.strip().lower()
    if prev in OFFLINE_RULES:
        return prev
    for key, rule in OFFLINE_RULES.items():
        if rule["hazard"].lower() == prev:
            return key
    classified = classify_hazard(previous_hazard)
    if classified != "unknown":
        return classified
    if "medical" in prev:
        return "medical"
    return None


def evaluate_offline_safety_plan(
    report: str,
    previous_hazard: Optional[str] = None,
    is_situation_update: bool = False
) -> AssistantAnalyzeResponse:
    """
    Deterministic safety evaluation matching reviewed national disaster safety protocols.
    Works 100% offline without any network or external API dependency.
    """
    detected_hazard = classify_hazard(report)
    previous_key = _normalize_previous_hazard(previous_hazard)
    if detected_hazard == "unknown" and previous_key:
        detected_hazard = previous_key

    rule = OFFLINE_RULES.get(detected_hazard, OFFLINE_RULES["unknown"])

    # If this is a situation update, adapt summary and prioritize escalations
    summary = rule["summary"]
    immediate_actions = list(rule["immediate_actions"])
    next_actions = list(rule["next_actions"])

    lower_report = report.lower()
    if is_situation_update:
        summary = f"SITUATION UPDATED: {summary}"
        if ("rising" in lower_report and "water" in lower_report) or "inundat" in lower_report:
            immediate_actions.insert(0, "URGENT UPDATE: Move immediately to the highest accessible level or roof.")
        if "blocked" in lower_report or "trapped" in lower_report:
            immediate_actions.insert(0, "URGENT UPDATE: Primary exit is blocked. Do not force doors; seal barriers, conserve oxygen, and signal your location via whistle or bright cloth.")
        if "smoke" in lower_report or "flame" in lower_report:
            immediate_actions.insert(0, "URGENT UPDATE: Dense smoke reported. Crawl beneath the smoke level immediately and cover face with damp cloth.")
        if "injury" in lower_report or "injured" in lower_report or "bleeding" in lower_report:
            immediate_actions.insert(0, "URGENT UPDATE: Injury reported. Control bleeding with firm direct pressure and dial 112 immediately.")


    return AssistantAnalyzeResponse(
        hazard=rule["hazard"],
        urgency=rule["urgency"],
        summary=summary,
        immediate_actions=immediate_actions,
        next_actions=next_actions,
        avoid_actions=rule["avoid_actions"],
        contact_emergency_services=rule["contact_emergency_services"],
        uncertainty=rule["uncertainty"],
        follow_up_questions=rule["follow_up_questions"],
        source_mode="local_fallback",
        safety_disclaimer=SAFETY_DISCLAIMER
    )
