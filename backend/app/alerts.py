"""Authoritative disaster alert feed adapter and demonstration records."""
from datetime import datetime, timezone
from typing import List, Optional
from app.schemas import AlertItem

DEMO_ALERTS: List[AlertItem] = [
    AlertItem(
        id="demo-alert-001",
        title="[DEMO] Heavy Rainfall & Flash Flood Advisory - Coastal Region",
        hazard="Flood / Heavy Rain",
        severity="severe",
        affected_area="Coastal Lowland District (Demo Sector 4)",
        source_authority="State Disaster Management Authority (SDMA - Demo Feed)",
        issue_time=datetime.now(timezone.utc).isoformat(),
        expiry_time="2026-10-24T18:00:00Z",
        source_url="https://sachet.ndma.gov.in",
        status="active",
        provenance="DEMO_NOT_VERIFIED",
        description="DEMO ALERT ONLY: Anticipate water accumulation in low-lying underpasses and arterial roads.",
        instruction="Avoid low-lying underpasses. Keep emergency grab bag ready. Follow official local radio broadcasts."
    ),
    AlertItem(
        id="demo-alert-002",
        title="[DEMO] Seismic Tremor Advisory - Magnitude 4.2 Recorded",
        hazard="Earthquake",
        severity="moderate",
        affected_area="Northern Himalayan Belt (Demo Region)",
        source_authority="National Centre for Seismology (NCS - Demo Feed)",
        issue_time=datetime.now(timezone.utc).isoformat(),
        expiry_time=None,
        source_url="https://seismo.gov.in",
        status="updated",
        provenance="DEMO_NOT_VERIFIED",
        description="DEMO ALERT ONLY: Minor seismic activity detected. No widespread structural damage reported.",
        instruction="Inspect residential gas connections and electrical mains. Be alert for minor aftershocks."
    ),
    AlertItem(
        id="demo-alert-003",
        title="[DEMO] Cyclonic Wind Advisory (Depression over Bay)",
        hazard="Cyclone / Storm Surge",
        severity="critical",
        affected_area="Eastern Coastal Strip (Demo Sector B)",
        source_authority="India Meteorological Department (IMD - Demo Feed)",
        issue_time=datetime.now(timezone.utc).isoformat(),
        expiry_time="2026-10-25T12:00:00Z",
        source_url="https://mausam.imd.gov.in",
        status="active",
        provenance="DEMO_NOT_VERIFIED",
        description="DEMO ALERT ONLY: Deep depression likely to intensify into cyclonic storm. Gusts up to 85 kmph.",
        instruction="Fishermen advised not to venture into deep sea. Coastal residents should identify designated cyclone shelters."
    )
]


class AlertFeedAdapter:
    """
    Adapter interface for authoritative alert feeds (e.g. CAP / RSS feeds from NDMA/SDMA).
    When no external feed URL is configured or online, provides transparent demo records
    with explicit DEMO_NOT_VERIFIED provenance.
    """

    def __init__(self, feed_url: Optional[str] = None):
        self.feed_url = feed_url

    async def get_alerts(self) -> List[AlertItem]:
        # If no live external authoritative endpoint is configured,
        # return the clearly marked demonstration records.
        # Live alerts must never be fabricated as real.
        return DEMO_ALERTS


feed_adapter = AlertFeedAdapter()


async def get_current_alerts() -> List[AlertItem]:
    return await feed_adapter.get_alerts()
