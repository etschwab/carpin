import { useEffect, useState } from "react";
import { Alert } from "react-native";

import { DEFAULT_VEHICLES, STORAGE_KEYS } from "../constants/appConstants";
import { loadStoredState, saveStoredValue } from "../services/storage";
import type { CustomMapMarker, ParkingHistoryItem, ParkingSpot, Vehicle } from "../types/parking";

export type PersistedAppState = ReturnType<typeof usePersistedAppState>;

// State / App Daten die lokal in AsyncStorage gespeichert werden
export function usePersistedAppState() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState(DEFAULT_VEHICLES[0].id);
  const [parkingSpot, setParkingSpot] = useState<ParkingSpot | null>(null);
  const [parkingHistory, setParkingHistory] = useState<ParkingHistoryItem[]>([]);
  const [customMarkers, setCustomMarkers] = useState<CustomMapMarker[]>([]);
  const [timerEnd, setTimerEnd] = useState<string | null>(null);
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const [timerSpotId, setTimerSpotId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Storage / Daten beim Start laden
  useEffect(() => {
    async function loadState() {
      const stored = await loadStoredState();

      if (stored.vehicles) {
        setVehicles(stored.vehicles);
        setSelectedVehicleId(stored.vehicles[0]?.id ?? DEFAULT_VEHICLES[0].id);
      }

      if (stored.parkingSpot) {
        setParkingSpot(stored.parkingSpot);
      }

      if (stored.parkingHistory) {
        setParkingHistory(stored.parkingHistory);
      }

      if (stored.customMarkers) {
        setCustomMarkers(stored.customMarkers);
      }

      if (stored.timerEnd) {
        setTimerEnd(stored.timerEnd);
      }

      if (stored.timerStartedAt) {
        setTimerStartedAt(stored.timerStartedAt);
      }

      if (stored.timerSpotId) {
        setTimerSpotId(stored.timerSpotId);
      }

      setIsHydrated(true);
    }

    loadState().catch(() => {
      Alert.alert("Speicherfehler", "Die lokalen Daten konnten nicht gelesen werden.");
      setIsHydrated(true);
    });
  }, []);

  // Storage / Aenderungen speichern
  useEffect(() => saveStoredValue(STORAGE_KEYS.vehicles, vehicles), [vehicles]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.parkingSpot, parkingSpot), [parkingSpot]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.parkingHistory, parkingHistory), [parkingHistory]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.customMarkers, customMarkers), [customMarkers]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.timerEnd, timerEnd), [timerEnd]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.timerStartedAt, timerStartedAt), [timerStartedAt]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.timerSpotId, timerSpotId), [timerSpotId]);

  return {
    customMarkers,
    isHydrated,
    parkingHistory,
    parkingSpot,
    selectedVehicleId,
    setCustomMarkers,
    setParkingHistory,
    setParkingSpot,
    setSelectedVehicleId,
    setTimerEnd,
    setTimerSpotId,
    setTimerStartedAt,
    setVehicles,
    timerEnd,
    timerSpotId,
    timerStartedAt,
    vehicles
  };
}
