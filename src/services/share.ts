import { Alert, Share } from "react-native";

import type { ParkingSpot } from "../types/parking";
import { getAppleMapsRouteUrl } from "./maps";

// Teilen / Parkplatz / Route / Foto teilen
export async function shareParkingSpot(parkingSpot: ParkingSpot, vehicleName: string) {
  const messageParts = [`${vehicleName} Parkplatz`, parkingSpot.address || "Gespeicherter Parkplatz"];

  if (parkingSpot.description) {
    messageParts.push(parkingSpot.description);
  }

  messageParts.push(`Apple Maps: ${getAppleMapsRouteUrl(parkingSpot)}`);

  try {
    await Share.share({
      message: messageParts.join("\n"),
      title: "CarPin Parkplatz",
      ...(parkingSpot.photoUri ? { url: parkingSpot.photoUri } : {})
    });
  } catch {
    Alert.alert("Teilen nicht möglich", "Der Parkplatz konnte nicht geteilt werden.");
  }
}
