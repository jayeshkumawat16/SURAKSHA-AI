import * as Location from "expo-location";
import { EmergencyLocation } from "../types";

let cachedLastLocation: EmergencyLocation | null = null;

export interface LocationCaptureResult {
  location: EmergencyLocation | null;
  error?: string;
  status: "granted" | "denied" | "timeout" | "unavailable";
}

/**
 * Requests location ONLY upon explicit user interaction.
 * Never calls Location in background without direct user tap.
 */
export async function captureCurrentLocation(): Promise<LocationCaptureResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      return {
        location: cachedLastLocation,
        status: "denied",
        error: "Location permission was denied. You can type your location manually."
      };
    }

    // Capture location with a safety timeout of 7 seconds
    const loc = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Location request timed out")), 7000)
      )
    ]);

    if (!loc) {
      return {
        location: cachedLastLocation,
        status: "timeout",
        error: "GPS signal timed out. You can enter your landmark manually."
      };
    }

    const emergencyLoc: EmergencyLocation = {
      latitude: Number(loc.coords.latitude.toFixed(5)),
      longitude: Number(loc.coords.longitude.toFixed(5)),
      accuracy: loc.coords.accuracy ? Math.round(loc.coords.accuracy) : null,
      timestamp: loc.timestamp
    };

    cachedLastLocation = emergencyLoc;

    return {
      location: emergencyLoc,
      status: "granted"
    };
  } catch (err: any) {
    return {
      location: cachedLastLocation,
      status: "unavailable",
      error: err.message || "Could not retrieve GPS coordinates. Please type your location manually."
    };
  }
}

export function formatLocationAge(timestamp?: number): string {
  if (!timestamp) return "Never captured";
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function generateGoogleMapsUrl(lat: number, lon: number): string {
  return `https://maps.google.com/?q=${lat},${lon}`;
}
