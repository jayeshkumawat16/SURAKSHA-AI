import { composeSOSMessage } from "../src/services/sos";
import { formatLocationAge, generateGoogleMapsUrl } from "../src/services/location";
import {
  classifyOfflineHazard,
  getOfflineSafetyGuidance,
  ALL_EMERGENCY_GUIDES
} from "../src/data/emergencyGuides";
import {
  getAllContacts,
  saveContact,
  deleteContact,
  clearAllContacts
} from "../src/storage/contactsRepository";
import {
  getAIMode,
  setAIMode,
  clearAllPersonalData
} from "../src/storage/settingsRepository";
import { requestEmergencyAnalysis } from "../src/services/assistant";
import { TrustedContact } from "../src/types";

describe("SOS Message Composition & Formatting", () => {
  it("constructs an SOS message with GPS coordinates and map link", () => {
    const loc = {
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 12,
      timestamp: Date.now()
    };
    const sos = composeSOSMessage("Trapped on roof, water rising", loc, "Gate 3");

    expect(sos.text).toContain("EMERGENCY SOS — SURAKSHA AI");
    expect(sos.text).toContain("Trapped on roof, water rising");
    expect(sos.text).toContain("28.6139, 77.209");
    expect(sos.text).toContain("(±12m)");
    expect(sos.text).toContain("https://maps.google.com/?q=28.6139,77.209");
    expect(sos.text).toContain("Gate 3");
    expect(sos.timestamp).toBeDefined();
  });

  it("constructs an SOS message with only manual location when GPS is absent", () => {
    const sos = composeSOSMessage("Fire on 4th floor", null, "Flat 402, Block B");

    expect(sos.text).toContain("Flat 402, Block B");
    expect(sos.text).not.toContain("GPS Coordinates");
    expect(sos.mapUrl).toBeUndefined();
  });

  it("handles empty location gracefully", () => {
    const sos = composeSOSMessage("Medical emergency", null, "");
    expect(sos.text).toContain("Location: Not attached. Verify position directly.");
  });

  it("formats location freshness and age properly", () => {
    expect(formatLocationAge(undefined)).toBe("Never captured");
    expect(formatLocationAge(Date.now())).toBe("Just now");
    expect(formatLocationAge(Date.now() - 5 * 60 * 1000)).toBe("5m ago");
    expect(formatLocationAge(Date.now() - 2 * 60 * 60 * 1000)).toBe("2h ago");
  });
});

describe("Deterministic Offline Safety Engine", () => {
  it("classifies disaster hazards deterministically", () => {
    expect(classifyOfflineHazard("Violent tremor and aftershock indoors")).toBe("earthquake");
    expect(classifyOfflineHazard("Rapid water rising in our basement floor")).toBe("flood");
    expect(classifyOfflineHazard("Dense black smoke and flames")).toBe("fire");
    expect(classifyOfflineHazard("Cyclone gale force winds tearing tin sheets")).toBe("cyclone");
    expect(classifyOfflineHazard("Person unconscious not breathing need CPR")).toBe("medical");
    expect(classifyOfflineHazard("Something feels wrong outside")).toBe("unknown");
  });

  it("provides complete offline safety plan for earthquake", () => {
    const plan = getOfflineSafetyGuidance("Violent shaking indoors");
    expect(plan.source_mode).toBe("local_fallback");
    expect(plan.hazard).toBe("Earthquake Shaking Indoors");
    expect(plan.urgency).toBe("immediate");
    expect(plan.immediate_actions.some((a) => a.includes("DROP"))).toBe(true);
    expect(plan.avoid_actions.some((a) => a.toLowerCase().includes("elevator"))).toBe(true);
    expect(plan.contact_emergency_services).toBe(true);
    expect(plan.safety_disclaimer).toContain("SURAKSHA AI");
  });

  it("adapts emergency guidance dynamically during situation updates", () => {
    const update = getOfflineSafetyGuidance(
      "Water is rising rapidly inside the living room",
      "flood",
      true
    );
    expect(update.summary).toContain("SITUATION UPDATED");
    expect(update.immediate_actions[0]).toContain("URGENT UPDATE");
    expect(update.immediate_actions[0]).toContain("highest accessible level");
  });

  it("contains all standard disaster safety guides in offline database", () => {
    expect(ALL_EMERGENCY_GUIDES.length).toBeGreaterThanOrEqual(6);
    const hazards = ALL_EMERGENCY_GUIDES.map((g) => g.hazard);
    expect(hazards).toContain("earthquake");
    expect(hazards).toContain("flood");
    expect(hazards).toContain("fire");
    expect(hazards).toContain("cyclone");
    expect(hazards).toContain("medical");
    expect(hazards).toContain("unknown");
  });
});

describe("Contact & Settings Persistence Logic", () => {
  beforeEach(async () => {
    await clearAllContacts();
    await clearAllPersonalData();
  });

  it("saves, retrieves, and deletes trusted contacts", async () => {
    const contact: TrustedContact = {
      id: "test-c1",
      name: "Dr. Arvind Sharma",
      phone: "+919876543210",
      relationship: "Physician",
      created_at: new Date().toISOString()
    };

    await saveContact(contact);
    const list = await getAllContacts();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("Dr. Arvind Sharma");
    expect(list[0].phone).toBe("+919876543210");

    await deleteContact("test-c1");
    const emptyList = await getAllContacts();
    expect(emptyList.length).toBe(0);
  });

  it("persists and restores AI operating mode", async () => {
    expect(await getAIMode()).toBe("auto");
    await setAIMode("offline");
    expect(await getAIMode()).toBe("offline");
    await setAIMode("gemini");
    expect(await getAIMode()).toBe("gemini");
  });
});

describe("Assistant Mode & Offline Fallback Selection", () => {
  it("returns offline safety rules when force_mode is offline", async () => {
    const result = await requestEmergencyAnalysis({
      report: "Flash flood entering courtyard",
      force_mode: "offline"
    });

    expect(result.success).toBe(true);
    expect(result.sourceMode).toBe("offline_manual");
    expect(result.data?.hazard).toContain("Flood");
  });

  it("automatically falls back to local safety rules when network is unreachable in auto mode", async () => {
    // In node/jest test environment, fetch to default localhost:8000 fails or is mock,
    // so auto mode should automatically invoke local deterministic fallback
    const result = await requestEmergencyAnalysis({
      report: "Earthquake shaking building",
      force_mode: "auto"
    });

    expect(result.success).toBe(true);
    expect(result.sourceMode).toBe("local_fallback");
    expect(result.data?.hazard).toContain("Earthquake");
  });
});
