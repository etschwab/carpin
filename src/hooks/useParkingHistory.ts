import { Alert } from "react-native";

import { MARKER_COLOR_OPTIONS, MAX_PARKING_HISTORY_ITEMS } from "../constants/appConstants";
import type { Coordinate, CustomMapMarker, ParkingHistoryItem } from "../types/parking";
import type { PersistedAppState } from "./usePersistedAppState";

// History / Parkplatz Verlauf und eigene Kartenpunkte pflegen
export function useParkingHistory(appState: PersistedAppState) {
  const { parkingHistory, setCustomMarkers, setParkingHistory } = appState;

  function saveSpotToHistory(spot: ParkingHistoryItem) {
    setParkingHistory((currentHistory) =>
      [spot, ...currentHistory.filter((historySpot) => historySpot.id !== spot.id)].slice(0, MAX_PARKING_HISTORY_ITEMS)
    );
  }

  function updateSpotInHistory(spot: ParkingHistoryItem) {
    setParkingHistory((currentHistory) =>
      currentHistory.map((historySpot) => (historySpot.id === spot.id ? spot : historySpot))
    );
  }

  function clearParkingHistory() {
    Alert.alert("History leeren", "Alle gespeicherten Parkplätze aus der History entfernen?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Leeren",
        style: "destructive",
        onPress: () => setParkingHistory([])
      }
    ]);
  }

  function deleteParkingHistoryItem(spotId: string) {
    const historySpot = parkingHistory.find((spot) => spot.id === spotId);
    if (!historySpot) {
      return;
    }

    Alert.alert("Parkplatz löschen", `${historySpot.address || "Diesen Parkplatz"} aus der History entfernen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: () => setParkingHistory((currentHistory) => currentHistory.filter((spot) => spot.id !== spotId))
      }
    ]);
  }

  // Map / Marker / eigener Kartenpunkt hinzufuegen
  function addCustomMarker(coordinate: Coordinate, name: string, color: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const nextColor = MARKER_COLOR_OPTIONS.includes(color as (typeof MARKER_COLOR_OPTIONS)[number]) ? color : MARKER_COLOR_OPTIONS[0];
    const nextMarker: CustomMapMarker = {
      id: `marker-${Date.now()}`,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      color: nextColor,
      createdAt: new Date().toISOString(),
      name: trimmedName
    };

    setCustomMarkers((currentMarkers) => [nextMarker, ...currentMarkers]);
  }

  function deleteCustomMarker(markerId: string) {
    setCustomMarkers((currentMarkers) => currentMarkers.filter((marker) => marker.id !== markerId));
  }

  return {
    addCustomMarker,
    clearParkingHistory,
    deleteCustomMarker,
    deleteParkingHistoryItem,
    saveSpotToHistory,
    updateSpotInHistory
  };
}
