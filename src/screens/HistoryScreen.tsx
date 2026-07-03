import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/appStyles";
import type { ParkingHistoryItem, Vehicle } from "../types/parking";
import { formatTime } from "../utils/time";

type HistoryScreenProps = {
  history: ParkingHistoryItem[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (spotId: string) => void;
  onOpenRoute: (spot: ParkingHistoryItem) => void;
  vehicles: Vehicle[];
};

// History / Parkplatz Verlauf / alte Parkplaetze
export function HistoryScreen({
  history,
  onClearHistory,
  onDeleteHistoryItem,
  onOpenRoute,
  vehicles
}: HistoryScreenProps) {
  // History / Fahrzeug Name / gespeichertes Fahrzeug finden
  function getVehicleName(vehicleId: string) {
    return vehicles.find((vehicle) => vehicle.id === vehicleId)?.name ?? "Fahrzeug";
  }

  // History / Leer Zustand / keine Parkplaetze
  if (history.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>History</Text>
          <Text style={styles.emptyHistoryText}>Noch keine gespeicherten Parkplätze.</Text>
        </View>
      </ScrollView>
    );
  }

  // History / Liste / Route oder Loeschen
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.historyHeaderRow}>
        <Text style={styles.panelTitle}>Letzte Parkplätze</Text>
        <TouchableOpacity onPress={onClearHistory}>
          <Text style={styles.deleteText}>Alle leeren</Text>
        </TouchableOpacity>
      </View>

      {history.map((spot) => (
        <View key={spot.id} style={styles.historyCard}>
          <View style={styles.historyTopRow}>
            <View style={styles.pinBadge}>
              <Text style={styles.pinBadgeText}>P</Text>
            </View>
            <View style={styles.historyTitleWrap}>
              <Text style={styles.savedEyebrow}>{formatTime(spot.savedAt)}</Text>
              <Text style={styles.savedTitle}>{spot.address || "Gespeicherter Parkplatz"}</Text>
              <Text style={styles.savedMeta}>{getVehicleName(spot.vehicleId)}</Text>
            </View>
          </View>

          {spot.description ? <Text style={styles.parkingDescriptionText}>{spot.description}</Text> : null}

          <View style={styles.historyMetaRow}>
            <Text style={styles.historyMetaText}>
              {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}
            </Text>
            <Text style={styles.historyMetaText}>{spot.photoUri ? "Foto gespeichert" : "Ohne Foto"}</Text>
          </View>

          <View style={styles.historyActionRow}>
            <TouchableOpacity style={styles.historyRouteButton} onPress={() => onOpenRoute(spot)}>
              <Text style={styles.timerShortcutText}>Route öffnen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.historyDeleteButton} onPress={() => onDeleteHistoryItem(spot.id)}>
              <Text style={styles.endParkingButtonText}>Löschen</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
