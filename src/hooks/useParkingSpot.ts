import { useState } from "react";
import { Alert } from "react-native";

import { pickPhotoUri } from "../services/photos";
import type { Coordinate, ParkingHistoryItem, ParkingSpot, PhotoSource, Screen, Vehicle } from "../types/parking";
import { reverseGeocode } from "../utils/location";
import type { PersistedAppState } from "./usePersistedAppState";

type ParkingSpotDependencies = {
  appState: PersistedAppState;
  getDeviceLocation: (showErrors: boolean) => Promise<Coordinate | null>;
  navigate: (screen: Screen) => void;
  saveSpotToHistory: (spot: ParkingHistoryItem) => void;
  selectedVehicle: Vehicle | undefined;
  stopTimer: () => void;
  updateSpotInHistory: (spot: ParkingHistoryItem) => void;
};

// Parkplatz / Parking speichern, bearbeiten und beenden
export function useParkingSpot({
  appState,
  getDeviceLocation,
  navigate,
  saveSpotToHistory,
  selectedVehicle,
  stopTimer,
  updateSpotInHistory
}: ParkingSpotDependencies) {
  const { parkingSpot, setParkingSpot, timerSpotId } = appState;
  const [parkingDescription, setParkingDescription] = useState("");
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [isSavingSpot, setIsSavingSpot] = useState(false);
  const [isPhotoVisible, setIsPhotoVisible] = useState(false);

  function updateParkingSpot(updatedParkingSpot: ParkingSpot) {
    setParkingSpot(updatedParkingSpot);
    updateSpotInHistory(updatedParkingSpot);
  }

  // Parkplatz / GPS Standort speichern
  async function saveParkingSpot() {
    if (!selectedVehicle) {
      Alert.alert("Kein Fahrzeug", "Bitte füge zuerst ein Fahrzeug hinzu.");
      navigate("vehicles");
      return;
    }

    setIsSavingSpot(true);

    try {
      const coordinate = await getDeviceLocation(true);
      if (!coordinate) {
        return;
      }

      const address = await reverseGeocode(coordinate.latitude, coordinate.longitude);

      const newParkingSpot: ParkingSpot = {
        id: String(Date.now()),
        vehicleId: selectedVehicle.id,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address || "Gespeicherter Parkplatz",
        description: parkingDescription.trim() || undefined,
        photoUri: pendingPhotoUri || undefined,
        savedAt: new Date().toISOString()
      };

      setParkingSpot(newParkingSpot);
      saveSpotToHistory(newParkingSpot);

      setParkingDescription("");
      setPendingPhotoUri(null);
      Alert.alert("Parkplatz gespeichert", "Dein aktueller Standort wurde in der Karte gespeichert.");
    } catch {
      Alert.alert("Fehler", "Der Parkplatz konnte nicht gespeichert werden.");
    } finally {
      setIsSavingSpot(false);
    }
  }

  // Foto / vor dem Speichern merken oder direkt am Parkplatz setzen
  async function pickPhoto(source: PhotoSource) {
    const photoUri = await pickPhotoUri(source);
    if (!photoUri) {
      return;
    }

    if (!parkingSpot) {
      setPendingPhotoUri(photoUri);
      return;
    }

    updateParkingSpot({ ...parkingSpot, photoUri });
  }

  // Beschreibung / Notiz / Parkplatz Text speichern
  function updateParkingSpotDescription(value: string) {
    if (!parkingSpot) {
      return;
    }

    const description = value.trim();
    updateParkingSpot({ ...parkingSpot, description: description || undefined });
  }

  // Parkplatz / Parking beenden
  function clearParkingSpot() {
    if (parkingSpot?.id === timerSpotId) {
      stopTimer();
    }

    setParkingSpot(null);
    setIsPhotoVisible(false);
    setParkingDescription("");
    setPendingPhotoUri(null);
  }

  return {
    clearParkingSpot,
    isPhotoVisible,
    isSavingSpot,
    parkingDescription,
    pendingPhotoUri,
    pickPhoto,
    saveParkingSpot,
    setIsPhotoVisible,
    setParkingDescription,
    updateParkingSpotDescription
  };
}
