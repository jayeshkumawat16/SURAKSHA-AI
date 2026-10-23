import { Share, Linking, Alert } from "react-native";
import { EmergencyLocation, PreparedSOSMessage } from "../types";
import { generateGoogleMapsUrl } from "./location";
import { saveLastSOSMessage } from "../storage/guidesRepository";

export function composeSOSMessage(
  situationDescription: string,
  location?: EmergencyLocation | null,
  manualLocation?: string
): PreparedSOSMessage {
  const now = new Date();
  const timestampStr = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  let locPart = "";
  let mapUrl = "";

  if (location && location.latitude && location.longitude) {
    mapUrl = generateGoogleMapsUrl(location.latitude, location.longitude);
    const accStr = location.accuracy ? ` (±${location.accuracy}m)` : "";
    locPart = `\n📍 GPS Coordinates: ${location.latitude}, ${location.longitude}${accStr}\n🗺️ Map: ${mapUrl}`;
  }

  if (manualLocation && manualLocation.trim().length > 0) {
    locPart += `\n📍 Landmark/Address: ${manualLocation.trim()}`;
  }

  if (!locPart) {
    locPart = "\n📍 Location: Not attached. Verify position directly.";
  }

  const desc = situationDescription.trim() || "Immediate emergency assistance required.";

  const text = `🚨 EMERGENCY SOS — SURAKSHA AI 🚨
⚠️ URGENT: I need immediate emergency help.
📝 Situation: ${desc}${locPart}
⏰ Reported: ${timestampStr}
⚠️ Dispatched from SURAKSHA AI Mobile.`;

  return {
    text,
    location,
    manualLocation,
    timestamp: timestampStr,
    mapUrl: mapUrl || undefined
  };
}

export async function shareSOSMessage(messageText: string): Promise<{
  opened: boolean;
  userCancelled: boolean;
  error?: string;
}> {
  try {
    // Persist locally so message is not lost
    await saveLastSOSMessage(messageText);

    const result = await Share.share(
      {
        message: messageText,
        title: "SURAKSHA AI Emergency SOS"
      },
      {
        dialogTitle: "Send Emergency SOS"
      }
    );

    if (result.action === Share.sharedAction) {
      return { opened: true, userCancelled: false };
    } else if (result.action === Share.dismissedAction) {
      return { opened: false, userCancelled: true };
    }
    return { opened: true, userCancelled: false };
  } catch (error: any) {
    return {
      opened: false,
      userCancelled: false,
      error: error.message || "Unable to open system share sheet."
    };
  }
}

export function promptAndCallEmergencyServices(serviceNumber: string = "112") {
  Alert.alert(
    "Emergency Call Confirmation",
    `Are you sure you want to open your phone dialler to call ${serviceNumber}? SURAKSHA AI will never dial automatically.`,
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: `Open Dialler (${serviceNumber})`,
        style: "destructive",
        onPress: () => {
          const telUrl = `tel:${serviceNumber}`;
          Linking.canOpenURL(telUrl)
            .then((supported) => {
              if (supported) {
                Linking.openURL(telUrl);
              } else {
                Alert.alert("Dialler Unavailable", `Cannot open dialler for ${serviceNumber} on this device.`);
              }
            })
            .catch(() => {
              Alert.alert("Error", `Could not initiate phone call to ${serviceNumber}.`);
            });
        }
      }
    ]
  );
}
