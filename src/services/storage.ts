import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "../constants/appConstants";
import type { CustomMapMarker, ParkingHistoryItem, ParkingSpot, Vehicle } from "../types/parking";

export type StoredState = {
  vehicles: Vehicle[] | null;
  parkingSpot: ParkingSpot | null;
  parkingHistory: ParkingHistoryItem[] | null;
  customMarkers: CustomMapMarker[] | null;
  timerEnd: string | null;
  timerStartedAt: string | null;
  timerSpotId: string | null;
};

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function parseJson<T>(value: string | null): T | null {
  return value ? (JSON.parse(value) as T) : null;
}

// Storage / AsyncStorage / Daten laden
export async function loadStoredState(): Promise<StoredState> {
  const [vehicles, parkingSpot, parkingHistory, customMarkers, timerEnd, timerStartedAt, timerSpotId] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.vehicles),
    AsyncStorage.getItem(STORAGE_KEYS.parkingSpot),
    AsyncStorage.getItem(STORAGE_KEYS.parkingHistory),
    AsyncStorage.getItem(STORAGE_KEYS.customMarkers),
    AsyncStorage.getItem(STORAGE_KEYS.timerEnd),
    AsyncStorage.getItem(STORAGE_KEYS.timerStartedAt),
    AsyncStorage.getItem(STORAGE_KEYS.timerSpotId)
  ]);

  return {
    vehicles: parseJson<Vehicle[]>(vehicles),
    parkingSpot: parseJson<ParkingSpot>(parkingSpot),
    parkingHistory: parseJson<ParkingHistoryItem[]>(parkingHistory),
    customMarkers: parseJson<CustomMapMarker[]>(customMarkers),
    timerEnd,
    timerStartedAt,
    timerSpotId
  };
}

// Storage / Wert speichern oder bei null entfernen
export function saveStoredValue(key: StorageKey, value: unknown) {
  if (value === null || value === undefined) {
    AsyncStorage.removeItem(key).catch(() => undefined);
    return;
  }

  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  AsyncStorage.setItem(key, serialized).catch(() => undefined);
}
