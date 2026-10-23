// Demo records mirrored from backend/app/alerts.py and backend/app/resources.py.
// All entries carry DEMO_NOT_VERIFIED provenance; live alerts must never be fabricated as real.

export const DEMO_ALERTS = [
  {
    "id": "demo-alert-001",
    "title": "[DEMO] Heavy Rainfall & Flash Flood Advisory - Coastal Region",
    "hazard": "Flood / Heavy Rain",
    "severity": "severe",
    "affected_area": "Coastal Lowland District (Demo Sector 4)",
    "source_authority": "State Disaster Management Authority (SDMA - Demo Feed)",
    "issue_time": "",
    "expiry_time": "2026-10-24T18:00:00Z",
    "source_url": "https://sachet.ndma.gov.in",
    "status": "active",
    "provenance": "DEMO_NOT_VERIFIED",
    "description": "DEMO ALERT ONLY: Anticipate water accumulation in low-lying underpasses and arterial roads.",
    "instruction": "Avoid low-lying underpasses. Keep emergency grab bag ready. Follow official local radio broadcasts."
  },
  {
    "id": "demo-alert-002",
    "title": "[DEMO] Seismic Tremor Advisory - Magnitude 4.2 Recorded",
    "hazard": "Earthquake",
    "severity": "moderate",
    "affected_area": "Northern Himalayan Belt (Demo Region)",
    "source_authority": "National Centre for Seismology (NCS - Demo Feed)",
    "issue_time": "",
    "expiry_time": null,
    "source_url": "https://seismo.gov.in",
    "status": "updated",
    "provenance": "DEMO_NOT_VERIFIED",
    "description": "DEMO ALERT ONLY: Minor seismic activity detected. No widespread structural damage reported.",
    "instruction": "Inspect residential gas connections and electrical mains. Be alert for minor aftershocks."
  },
  {
    "id": "demo-alert-003",
    "title": "[DEMO] Cyclonic Wind Advisory (Depression over Bay)",
    "hazard": "Cyclone / Storm Surge",
    "severity": "critical",
    "affected_area": "Eastern Coastal Strip (Demo Sector B)",
    "source_authority": "India Meteorological Department (IMD - Demo Feed)",
    "issue_time": "",
    "expiry_time": "2026-10-25T12:00:00Z",
    "source_url": "https://mausam.imd.gov.in",
    "status": "active",
    "provenance": "DEMO_NOT_VERIFIED",
    "description": "DEMO ALERT ONLY: Deep depression likely to intensify into cyclonic storm. Gusts up to 85 kmph.",
    "instruction": "Fishermen advised not to venture into deep sea. Coastal residents should identify designated cyclone shelters."
  }
];

export const DEMO_RESOURCES = [
  {
    "id": "res-001",
    "name": "District Civil Hospital Emergency Ward",
    "category": "hospital",
    "address": "Civil Lines Road, Sector 1, Central District",
    "latitude": 28.6139,
    "longitude": 77.209,
    "phone": "+91-11-2338-0000",
    "operating_status": "open",
    "source": "Public Health Directory (Demo)",
    "last_verified": "2026-10-20T10:00:00Z",
    "provenance": "DEMO_NOT_VERIFIED",
    "notes": "24/7 trauma & emergency triage services. Verify bed availability via phone before transit if possible."
  },
  {
    "id": "res-002",
    "name": "Community High School Cyclone Shelter",
    "category": "shelter",
    "address": "Coastal Ring Road, Near Gate 2",
    "latitude": 28.625,
    "longitude": 77.215,
    "phone": "+91-11-2338-1111",
    "operating_status": "limited",
    "source": "Municipal Disaster Management Cell (Demo)",
    "last_verified": "2026-10-18T14:30:00Z",
    "provenance": "DEMO_NOT_VERIFIED",
    "notes": "Reinforced concrete hall designated as storm refuge. Check with local warden for capacity."
  },
  {
    "id": "res-003",
    "name": "Red Cross Clean Water & Food Distribution Point",
    "category": "food_water",
    "address": "Old Railway Goods Shed, Platform 4 Access",
    "latitude": 28.608,
    "longitude": 77.22,
    "phone": null,
    "operating_status": "open",
    "source": "Red Cross Volunteer Roster (Demo)",
    "last_verified": "2026-10-22T08:00:00Z",
    "provenance": "DEMO_NOT_VERIFIED",
    "notes": "Purified water tankers and dry rations distributed 08:00 - 18:00 during declared emergencies."
  },
  {
    "id": "res-004",
    "name": "Sub-Divisional Relief & Evacuation Staging Post",
    "category": "relief_center",
    "address": "Town Hall Grounds, Main Bazar",
    "latitude": 28.63,
    "longitude": 77.2,
    "phone": "+91-11-2338-2222",
    "operating_status": "open",
    "source": "District Collectorate Emergency Wing (Demo)",
    "last_verified": "2026-10-21T12:00:00Z",
    "provenance": "DEMO_NOT_VERIFIED",
    "notes": "Coordination post for evacuation buses and emergency ration card verification."
  },
  {
    "id": "res-005",
    "name": "State Disaster Response Supply Depot",
    "category": "supplies",
    "address": "Industrial Estate Warehouse 14",
    "latitude": 28.595,
    "longitude": 77.195,
    "phone": "+91-11-2338-3333",
    "operating_status": "limited",
    "source": "State Warehousing Corporation (Demo)",
    "last_verified": "2026-10-19T09:15:00Z",
    "provenance": "DEMO_NOT_VERIFIED",
    "notes": "Tarpaulins, sandbags, and water purification tablets for authorized relief teams."
  },
  {
    "id": "res-006",
    "name": "Central Fire & Rescue Station (Control Room)",
    "category": "emergency_service",
    "address": "Brigade Crossway, Sector 3",
    "latitude": 28.62,
    "longitude": 77.225,
    "phone": "101",
    "operating_status": "open",
    "source": "Fire & Emergency Services Dept (Demo)",
    "last_verified": "2026-10-23T06:00:00Z",
    "provenance": "DEMO_NOT_VERIFIED",
    "notes": "Municipal fire tender dispatch and heavy rescue equipment depot."
  }
];
