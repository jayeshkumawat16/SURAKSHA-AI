import { EmergencyGuide, AssistantResponse, HazardType } from "../types";

export const SAFETY_DISCLAIMER =
  "SURAKSHA AI guidance is for situational awareness and emergency reference. " +
  "It is NOT an official alert, legal directive, or medical diagnosis. " +
  "Always dial 112 (India) or follow official NDRF/SDMA instructions in immediate danger.";

export const ALL_EMERGENCY_GUIDES: EmergencyGuide[] = [
  {
    id: "guide-earthquake",
    hazard: "earthquake",
    title: "Earthquake Shaking Indoors",
    shortSummary: "DROP, COVER, and HOLD ON until tremors cease. Do not run outside while shaking is active.",
    immediateDo: [
      "DROP down onto your hands and knees immediately.",
      "COVER your head and neck beneath a sturdy desk or table.",
      "HOLD ON to your shelter with one hand and protect your neck with the other.",
      "Stay away from exterior glass windows, mirrors, hanging fixtures, and unanchored tall furniture.",
      "If in bed, stay there and curl face down, covering your head with a pillow."
    ],
    immediateAvoid: [
      "Do NOT run outside during active shaking; falling tiles and masonry cause most injuries.",
      "NEVER use elevators or lifts under any circumstances.",
      "Do NOT stand in doorways unless verified as reinforced load-bearing frames.",
      "Do NOT ignite lighters, matches, or candles until gas mains are confirmed intact."
    ],
    postIncidentSteps: [
      "Expect aftershocks. Be prepared to Drop, Cover, and Hold On again.",
      "Check yourself and nearby persons for injuries. Administer first aid if trained.",
      "Inspect utility lines: shut off gas at the meter if you smell gas or hear hissing.",
      "Exit cautiously via stairwells, watching for fallen debris and structural fractures.",
      "Assemble in open outdoor areas away from overhead power lines, trees, and facades."
    ],
    emergencyServicesAdvice: "Dial 112 immediately if someone is trapped under collapsed debris, bleeding severely, or if active gas fire is detected.",
    icon: "activity"
  },
  {
    id: "guide-flood",
    hazard: "flood",
    title: "Flood & Flash Inundation",
    shortSummary: "Move to higher ground immediately. Avoid moving water on foot and in vehicles.",
    immediateDo: [
      "Move to higher ground or upper floors immediately if water begins entering.",
      "Turn off main electrical breaker and gas cylinders if you can reach them without touching standing water.",
      "Grab essential medications, documents sealed in waterproof ziplocks, and power banks."
    ],
    immediateAvoid: [
      "NEVER walk, swim, or drive through floodwaters ('Turn Around, Don't Drown'). Just 15 cm of rapid water can knock you down.",
      "Do NOT touch submerged power outlets, downed cables, or appliances while wet.",
      "Do NOT drink unboiled tap or well water; assume floodwater is contaminated."
    ],
    postIncidentSteps: [
      "If trapped inside a multi-story building, ascend to the roof only if necessary; signal for rescue with bright fabric.",
      "Drink only bottled, chlorinated, or rolling-boiled water.",
      "Watch out for snakes and hazardous wildlife displaced by rising water.",
      "Follow official State Disaster Management Authority (SDMA) evacuation notices."
    ],
    emergencyServicesAdvice: "Dial 112 or contact the local flood rescue control room when water levels threaten your safe elevation.",
    icon: "droplet"
  },
  {
    id: "guide-fire",
    hazard: "fire",
    title: "Building Fire & Smoke",
    shortSummary: "Crawl low under smoke, feel doors before opening, and evacuate via designated stairs.",
    immediateDo: [
      "Evacuate immediately upon detecting fire or smoke via external stairwells.",
      "Crawl low on hands and knees—cleaner, breathable air remains near the floor.",
      "Check door handles with the back of your hand: if hot, do NOT open."
    ],
    immediateAvoid: [
      "NEVER take an elevator during a fire.",
      "Do NOT open hot doors or doors where smoke is pushing through seams.",
      "NEVER re-enter a burning structure for personal possessions or pets."
    ],
    postIncidentSteps: [
      "If trapped in a room: close the door, seal cracks and ventilation ducts with wet cloth or tape.",
      "Open an exterior window slightly for air and wave a brightly colored cloth or flashlight to attract rescuers.",
      "Dial 112 / 101 to report your exact floor and room number.",
      "Once outside, gather at designated evacuation assembly point."
    ],
    emergencyServicesAdvice: "Dial 101 or 112 immediately. Inform fire personnel if individuals are known to remain trapped on specific floors.",
    icon: "flame"
  },
  {
    id: "guide-cyclone",
    hazard: "cyclone",
    title: "Cyclone & Severe Wind Storm",
    shortSummary: "Shelter in an interior room without windows. Beware of the false calm in the eye of the storm.",
    immediateDo: [
      "Shelter in a reinforced, windowless central room, hallway, or bathroom.",
      "Secure or bring indoors loose items, flower pots, sheetings, and outdoor furniture.",
      "Unplug electrical appliances to protect from surges and lightning strikes."
    ],
    immediateAvoid: [
      "Do NOT stay near exterior glass windows or patio doors.",
      "Do NOT venture outside when winds suddenly calm—the calm eye may be passing, and destructive reverse winds will follow abruptly.",
      "Do NOT touch downed power lines or flooded metal gates."
    ],
    postIncidentSteps: [
      "Remain sheltered until local disaster authorities announce that the cyclone has officially passed.",
      "Inspect home for structural integrity before allowing family into perimeter rooms.",
      "Boil all drinking water and discard food that came into contact with floodwater."
    ],
    emergencyServicesAdvice: "Dial 112 if roofs blow off, walls collapse, or individuals sustain serious trauma.",
    icon: "wind"
  },
  {
    id: "guide-medical",
    hazard: "medical",
    title: "Acute Medical Emergency & First Aid",
    shortSummary: "Assess scene safety, check responsiveness and breathing, dial 112, and provide basic first aid.",
    immediateDo: [
      "Verify the area is safe for yourself before approaching an injured person.",
      "Check for responsiveness: tap collarbone firmly and ask 'Are you alright?'.",
      "If unresponsive and not breathing normally: call 112 immediately and start Hands-Only CPR (push hard and fast in center of chest at 100-120 bpm).",
      "For severe arterial or venous bleeding, apply continuous direct pressure with a clean cloth."
    ],
    immediateAvoid: [
      "Do NOT administer liquids, water, or oral tablets to an unconscious or semiconscious patient.",
      "Do NOT move someone with suspected spinal, neck, or head injuries unless life is in imminent peril from fire or collapse.",
      "Do NOT remove deeply embedded puncture objects (e.g. rebar, glass) yourself."
    ],
    postIncidentSteps: [
      "Keep the patient warm with a blanket or jacket to mitigate circulatory shock.",
      "Gather the patient's existing medication boxes or medical ID for the ambulance crew.",
      "Stay on the phone with the 112 dispatcher if possible and provide clear street landmarks."
    ],
    emergencyServicesAdvice: "Dial 112 / 102 immediately for chest pain, stroke signs (face drooping, arm weakness), severe hemorrhage, or unconsciousness.",
    icon: "heart"
  },
  {
    id: "guide-unknown",
    hazard: "unknown",
    title: "General Emergency Preparedness",
    shortSummary: "Assess hazards, protect life, consult authoritative channels, and dial 112 if in danger.",
    immediateDo: [
      "Assess your surroundings for immediate threats: smoke, structural damage, water, or live wires.",
      "Ensure personal safety and assemble your household in a secure room.",
      "Keep your emergency grab-bag, ID documents, and charged devices with you."
    ],
    immediateAvoid: [
      "Do NOT panic or forward unverified viral warnings from social platforms.",
      "Do NOT cross unknown water depths or enter structurally distressed buildings.",
      "Do NOT tie up emergency phone lines for general inquiries."
    ],
    postIncidentSteps: [
      "Tune into official district disaster management feeds or All India Radio broadcasts.",
      "Prepare your emergency SOS message in SURAKSHA AI in case communications degrade.",
      "Conserve phone battery by switching to battery-saver mode."
    ],
    emergencyServicesAdvice: "Dial 112 if there is an imminent threat to life, health, or property.",
    icon: "shield"
  }
];

export function classifyOfflineHazard(text: string): HazardType {
  // Patterns match common inflections (flooding, flooded, flames, earthquakes, ...).
  // Bare stems wrapped in \b...\b previously never matched "flooding" or "inundated".
  const lower = text.toLowerCase();
  if (/\b(?:earthquakes?|quakes?|tremors?|shaking|aftershocks?|seismic|ground shaking)\b/.test(lower)) {
    return "earthquake";
  }
  if (/\b(?:flood\w*|water level|waters? (?:is |are )?ris(?:ing|e|es)|drowning|overflow\w*|inundat\w*|submerg\w*)\b/.test(lower)) {
    return "flood";
  }
  if (/\b(?:fires?|smok(?:e|ing|y)|flames?|flaming|burning|burn|fire alarm|blaz(?:e|es|ing)|gas leaks?|explosions?)\b/.test(lower)) {
    return "fire";
  }
  if (/\b(?:cyclones?|hurricanes?|typhoons?|storms?|heavy winds?|gales?|tornad(?:o|oes))\b/.test(lower)) {
    return "cyclone";
  }
  if (/\b(?:cpr|unconscious|bleeding|heart attack|chest pain|choking|stroke|fractures?|wounds?|poison\w*|injur(?:y|ies|ed)|breathing)\b/.test(lower)) {
    return "medical";
  }
  return "unknown";
}

/**
 * The assistant screen sends back the hazard label it last displayed (e.g. "Flood & Flash Inundation"
 * or the backend's "Flooding"), not an internal key. Map either form to a HazardType.
 */
function normalizePreviousHazard(previousHazard?: string): HazardType | undefined {
  if (!previousHazard) return undefined;
  const prev = previousHazard.trim().toLowerCase();
  const valid: HazardType[] = ["earthquake", "flood", "fire", "cyclone", "medical"];
  if ((valid as string[]).includes(prev)) return prev as HazardType;
  const byTitle = ALL_EMERGENCY_GUIDES.find((g) => g.title.toLowerCase() === prev);
  if (byTitle && byTitle.hazard !== "unknown") return byTitle.hazard;
  const classified = classifyOfflineHazard(previousHazard);
  if (classified !== "unknown") return classified;
  if (prev.includes("medical")) return "medical";
  return undefined;
}

export function getOfflineSafetyGuidance(
  report: string,
  previousHazard?: string,
  isSituationUpdate?: boolean
): AssistantResponse {
  let detected = classifyOfflineHazard(report);
  if (detected === "unknown") {
    const previous = normalizePreviousHazard(previousHazard);
    if (previous) {
      detected = previous;
    }
  }

  const guide =
    ALL_EMERGENCY_GUIDES.find((g) => g.hazard === detected) ||
    ALL_EMERGENCY_GUIDES[ALL_EMERGENCY_GUIDES.length - 1];

  let summary = guide.shortSummary;
  const immediateActions = [...guide.immediateDo];
  const nextActions = [...guide.postIncidentSteps];

  if (isSituationUpdate) {
    summary = `SITUATION UPDATED: ${summary}`;
    const lower = report.toLowerCase();
    if (lower.includes("rising") && lower.includes("water") || lower.includes("inundat")) {
      immediateActions.unshift("URGENT UPDATE: Move immediately to the highest accessible level or roof.");
    }
    if (lower.includes("blocked") || lower.includes("trapped")) {
      immediateActions.unshift("URGENT UPDATE: Primary exit is blocked. Do not force doors; seal barriers, conserve oxygen, and signal your location via whistle or bright cloth.");
    }
    if (lower.includes("smoke") || lower.includes("flame")) {
      immediateActions.unshift("URGENT UPDATE: Dense smoke reported. Crawl beneath smoke line immediately and cover mouth with damp cloth.");
    }
    if (lower.includes("injury") || lower.includes("injured") || lower.includes("bleeding")) {
      immediateActions.unshift("URGENT UPDATE: Injury reported. Control bleeding with firm direct pressure and dial 112 immediately.");
    }
  }


  return {
    hazard: guide.title,
    urgency: detected === "unknown" ? "moderate" : "immediate",
    summary,
    immediate_actions: immediateActions,
    next_actions: nextActions,
    avoid_actions: guide.immediateAvoid,
    contact_emergency_services: detected !== "unknown",
    uncertainty: "Field conditions vary dynamically. Follow local official disaster management commands.",
    follow_up_questions: [
      "Is anyone trapped, injured, or in immediate danger?",
      "Are you in a safe shelter right now?"
    ],
    source_mode: "local_fallback",
    safety_disclaimer: SAFETY_DISCLAIMER
  };
}
