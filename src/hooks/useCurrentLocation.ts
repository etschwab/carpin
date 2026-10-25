import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

import type { Coordinate } from "../types/parking";
import { reverseGeocode } from "../utils/location";

// GPS / Location / aktueller Standort
export function useCurrentLocation() {
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  async function getDeviceLocation(showErrors: boolean) {
    setIsLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        if (showErrors) {
          Alert.alert("Standort fehlt", "Erlaube den Standortzugriff, damit CarPin deine Karte richtig anzeigen kann.");
        }
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      const address = await reverseGeocode(coordinate.latitude, coordinate.longitude);

      setCurrentLocation(coordinate);
      setCurrentLocationAddress(address ?? null);
      return coordinate;
    } catch {
      setCurrentLocationAddress(null);
      if (showErrors) {
        Alert.alert("Standortfehler", "Dein aktueller Standort konnte nicht gelesen werden.");
      }
      return null;
    } finally {
      setIsLocating(false);
    }
  }

  // Beim Start still den Standort holen
  useEffect(() => {
    getDeviceLocation(false).catch(() => undefined);
  }, []);

  return {
    currentLocation,
    currentLocationAddress,
    getDeviceLocation,
    isLocating
  };
}
