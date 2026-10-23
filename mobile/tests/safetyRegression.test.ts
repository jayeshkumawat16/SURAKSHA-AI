/**
 * Regression tests for confirmed audit findings (offline engine, alerts honesty, tel: sanitising,
 * erase-data completeness). Pure-logic only: no device, GPS or real network is used.
 */
import {
  classifyOfflineHazard,
  getOfflineSafetyGuidance
} from "../src/data/emergencyGuides";
import { promptAndCallEmergencyServices } from "../src/services/sos";
import { fetchAlerts } from "../src/services/alerts";
import {
  getChecklistItems,
  toggleChecklistItem,
  addCustomChecklistItem
} from "../src/storage/guidesRepository";
import { clearAllPersonalData } from "../src/storage/settingsRepository";

describe("Offline hazard classifier handles real-world phrasing", () => {
  const cases: Array<[string, string]> = [
    ["The streets are flooding and water is entering my house", "flood"],
    ["Our area got flooded last night", "flood"],
    ["My house is inundated", "flood"],
    ["The basement is submerged", "flood"],
    ["The river is overflowing", "flood"],
    ["Waters are rising quickly", "flood"],
    ["Earthquakes keep happening", "earthquake"],
    ["There are flames in the kitchen", "fire"]
  ];
  for (const [text, expected] of cases) {
    it(`classifies "${text}" as ${expected}`, () => {
      expect(classifyOfflineHazard(text)).toBe(expected);
    });
  }

  it("keeps previous behaviour for exact keywords", () => {
    expect(classifyOfflineHazard("Rapid water rising in our basement floor")).toBe("flood");
    expect(classifyOfflineHazard("Dense black smoke and flames")).toBe("fire");
    expect(classifyOfflineHazard("Something feels wrong outside")).toBe("unknown");
  });

  it("does not widen a plain burn injury into the fire-evacuation protocol", () => {
    expect(classifyOfflineHazard("My son burned his arm with hot oil")).toBe("unknown");
  });
});

describe("Situation-update continuity uses the label shown to the user", () => {
  const labels: Array<[string, string]> = [
    ["Flood & Flash Inundation", "Flood & Flash Inundation"],
    ["Building Fire & Smoke", "Building Fire & Smoke"],
    ["Earthquake Shaking Indoors", "Earthquake Shaking Indoors"],
    ["Cyclone & Severe Wind Storm", "Cyclone & Severe Wind Storm"],
    ["Acute Medical Emergency & First Aid", "Acute Medical Emergency & First Aid"],
    ["flood", "Flood & Flash Inundation"]
  ];
  for (const [prev, expectedTitle] of labels) {
    it(`previous hazard "${prev}" is retained when the update has no keyword`, () => {
      const res = getOfflineSafetyGuidance("It is getting worse, please help", prev, true);
      expect(res.hazard).toBe(expectedTitle);
    });
  }
});

describe("Emergency dialler", () => {
  it("strips spaces/punctuation from the tel: URL and opens it without a canOpenURL gate", async () => {
    const rn = require("react-native");
    rn.Alert.alert.mockClear();
    rn.Linking.openURL.mockClear();
    rn.Linking.canOpenURL.mockResolvedValue(false); // would block the call if the gate were still present

    promptAndCallEmergencyServices("+91 98765 43210");
    const buttons = rn.Alert.alert.mock.calls[0][2];
    buttons[1].onPress();
    await new Promise((r) => setTimeout(r, 0));

    expect(rn.Linking.openURL.mock.calls[0][0]).toBe("tel:+919876543210");
  });
});

describe("Alerts honesty", () => {
  const demoAlert = {
    id: "demo-1",
    title: "[DEMO] Test",
    hazard: "Flood",
    severity: "severe",
    affected_area: "Demo",
    source_authority: "Demo",
    issue_time: new Date().toISOString(),
    status: "active",
    provenance: "DEMO_NOT_VERIFIED",
    description: "demo"
  };

  it("does not report a LIVE feed when the backend only returns demo alerts", async () => {
    (globalThis as any).fetch = async () => ({ ok: true, json: async () => [demoAlert] });
    const result = await fetchAlerts();
    expect(result.alerts.length).toBe(1);
    expect(result.isLive).toBe(false);
  });

  it("reports a live feed when at least one alert is from an authoritative source", async () => {
    (globalThis as any).fetch = async () => ({
      ok: true,
      json: async () => [{ ...demoAlert, id: "real-1", provenance: "AUTHORITATIVE_SOURCE" }]
    });
    const result = await fetchAlerts();
    expect(result.isLive).toBe(true);
  });
});

describe("Erase all local data", () => {
  it("also removes checklist progress and custom checklist items", async () => {
    await getChecklistItems();
    await toggleChecklistItem("chk-1", true);
    await addCustomChecklistItem("My custom item");

    await clearAllPersonalData();

    const items = await getChecklistItems();
    expect(items.some((i) => i.isCustom)).toBe(false);
    expect(items.some((i) => i.completed)).toBe(false);
  });
});
