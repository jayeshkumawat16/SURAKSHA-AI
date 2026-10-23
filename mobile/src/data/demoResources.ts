import { LifelineResource } from "../types";

export const DEMO_RESOURCES: LifelineResource[] = [
  {
    id: "res-001",
    name: "District Civil Hospital Emergency Ward",
    category: "hospital",
    address: "Civil Lines Road, Sector 1, Central District",
    latitude: 28.6139,
    longitude: 77.2090,
    phone: "+91-11-2338-0000",
    operating_status: "open",
    source: "Public Health Directory (Demo)",
    last_verified: "2026-10-20T10:00:00Z",
    provenance: "DEMO_NOT_VERIFIED",
    notes: "24/7 trauma & emergency triage services. Verify bed availability via phone before transit if possible."
  },
  {
    id: "res-002",
    name: "Community High School Cyclone Shelter",
    category: "shelter",
    address: "Coastal Ring Road, Near Gate 2",
    latitude: 28.6250,
    longitude: 77.2150,
    phone: "+91-11-2338-1111",
    operating_status: "limited",
    source: "Municipal Disaster Management Cell (Demo)",
    last_verified: "2026-10-18T14:30:00Z",
    provenance: "DEMO_NOT_VERIFIED",
    notes: "Reinforced concrete hall designated as storm refuge. Check with local warden for capacity."
  },
  {
    id: "res-003",
    name: "Red Cross Clean Water & Food Distribution Point",
    category: "food_water",
    address: "Old Railway Goods Shed, Platform 4 Access",
    latitude: 28.6080,
    longitude: 77.2200,
    phone: null,
    operating_status: "open",
    source: "Red Cross Volunteer Roster (Demo)",
    last_verified: "2026-10-22T08:00:00Z",
    provenance: "DEMO_NOT_VERIFIED",
    notes: "Purified water tankers and dry rations distributed 08:00 - 18:00 during declared emergencies."
  },
  {
    id: "res-004",
    name: "Sub-Divisional Relief & Evacuation Staging Post",
    category: "relief_center",
    address: "Town Hall Grounds, Main Bazar",
    latitude: 28.6300,
    longitude: 77.2000,
    phone: "+91-11-2338-2222",
    operating_status: "open",
    source: "District Collectorate Emergency Wing (Demo)",
    last_verified: "2026-10-21T12:00:00Z",
    provenance: "DEMO_NOT_VERIFIED",
    notes: "Coordination post for evacuation buses and emergency ration card verification."
  },
  {
    id: "res-005",
    name: "State Disaster Response Supply Depot",
    category: "supplies",
    address: "Industrial Estate Warehouse 14",
    latitude: 28.5950,
    longitude: 77.1950,
    phone: "+91-11-2338-3333",
    operating_status: "limited",
    source: "State Warehousing Corporation (Demo)",
    last_verified: "2026-10-19T09:15:00Z",
    provenance: "DEMO_NOT_VERIFIED",
    notes: "Tarpaulins, sandbags, and water purification tablets for authorized relief teams."
  },
  {
    id: "res-006",
    name: "Central Fire & Rescue Station (Control Room)",
    category: "emergency_service",
    address: "Brigade Crossway, Sector 3",
    latitude: 28.6200,
    longitude: 77.2250,
    phone: "101",
    operating_status: "open",
    source: "Fire & Emergency Services Dept (Demo)",
    last_verified: "2026-10-23T06:00:00Z",
    provenance: "DEMO_NOT_VERIFIED",
    notes: "Municipal fire tender dispatch and heavy rescue equipment depot."
  }
];
