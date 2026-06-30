import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

type VehicleType = "Auto" | "Fahrrad" | "Motorrad" | "Scooter";

type Vehicle = {
  id: string;
  name: string;
  type: VehicleType;
};

type ParkingSpot = {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  savedAt: string;
  address?: string;
  photoUri?: string;
};

type Screen = "dashboard" | "timer" | "vehicles";

const STORAGE_KEYS = {
  vehicles: "carpin:vehicles",
  parkingSpot: "carpin:parkingSpot",
  timerEnd: "carpin:timerEnd"
};

const VEHICLE_TYPES: VehicleType[] = ["Auto", "Fahrrad", "Motorrad", "Scooter"];

const DEFAULT_VEHICLES: Vehicle[] = [
  { id: "vehicle-auto", name: "VW Golf", type: "Auto" },
  { id: "vehicle-bike", name: "Tims Fahrrad", type: "Fahrrad" }
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}

function formatCountdown(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) {
      return undefined;
    }

    return [place.street, place.streetNumber, place.city].filter(Boolean).join(" ");
  } catch {
    return undefined;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState(DEFAULT_VEHICLES[0].id);
  const [parkingSpot, setParkingSpot] = useState<ParkingSpot | null>(null);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>("Auto");
  const [timerEnd, setTimerEnd] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isSavingSpot, setIsSavingSpot] = useState(false);

  useEffect(() => {
    async function loadState() {
      const [storedVehicles, storedParkingSpot, storedTimerEnd] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.vehicles),
        AsyncStorage.getItem(STORAGE_KEYS.parkingSpot),
        AsyncStorage.getItem(STORAGE_KEYS.timerEnd)
      ]);

      if (storedVehicles) {
        const parsedVehicles = JSON.parse(storedVehicles) as Vehicle[];
        setVehicles(parsedVehicles);
        setSelectedVehicleId(parsedVehicles[0]?.id ?? DEFAULT_VEHICLES[0].id);
      }

      if (storedParkingSpot) {
        setParkingSpot(JSON.parse(storedParkingSpot) as ParkingSpot);
      }

      if (storedTimerEnd) {
        setTimerEnd(storedTimerEnd);
      }
    }

    loadState().catch(() => {
      Alert.alert("Speicherfehler", "Die lokalen Daten konnten nicht gelesen werden.");
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles)).catch(() => undefined);
  }, [vehicles]);

  useEffect(() => {
    if (parkingSpot) {
      AsyncStorage.setItem(STORAGE_KEYS.parkingSpot, JSON.stringify(parkingSpot)).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.parkingSpot).catch(() => undefined);
    }
  }, [parkingSpot]);

  useEffect(() => {
    if (timerEnd) {
      AsyncStorage.setItem(STORAGE_KEYS.timerEnd, timerEnd).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.timerEnd).catch(() => undefined);
    }
  }, [timerEnd]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0],
    [selectedVehicleId, vehicles]
  );

  const remainingMs = timerEnd ? new Date(timerEnd).getTime() - now : 0;
  const timerIsActive = Boolean(timerEnd && remainingMs > 0);

  async function saveParkingSpot() {
    if (!selectedVehicle) {
      Alert.alert("Kein Fahrzeug", "Bitte fuege zuerst ein Fahrzeug hinzu.");
      setScreen("vehicles");
      return;
    }

    setIsSavingSpot(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Standort fehlt", "Erlaube den Standortzugriff, damit CarPin den Parkplatz speichern kann.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const { latitude, longitude } = position.coords;
      const address = await reverseGeocode(latitude, longitude);

      setParkingSpot({
        id: String(Date.now()),
        vehicleId: selectedVehicle.id,
        latitude,
        longitude,
        address,
        savedAt: new Date().toISOString()
      });

      Alert.alert("Parkplatz gespeichert", "Dein aktueller Standort wurde gespeichert.");
    } catch {
      Alert.alert("Fehler", "Der Parkplatz konnte nicht gespeichert werden.");
    } finally {
      setIsSavingSpot(false);
    }
  }

  async function pickPhoto(source: "camera" | "library") {
    if (!parkingSpot) {
      Alert.alert("Kein Parkplatz", "Speichere zuerst einen Parkplatz.");
      return;
    }

    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("Berechtigung fehlt", "CarPin braucht Zugriff, um ein Parkplatzfoto zu speichern.");
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ["images"] });

    if (!result.canceled && result.assets[0]?.uri) {
      setParkingSpot({ ...parkingSpot, photoUri: result.assets[0].uri });
    }
  }

  function openRoute() {
    if (!parkingSpot) {
      return;
    }

    const url = `http://maps.apple.com/?daddr=${parkingSpot.latitude},${parkingSpot.longitude}&dirflg=w`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Route nicht moeglich", "Apple Maps konnte nicht geoeffnet werden.");
    });
  }

  function startTimer(minutes: number) {
    const end = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setTimerEnd(end);
    setScreen("timer");
  }

  function addVehicle() {
    const trimmedName = newVehicleName.trim();
    if (!trimmedName) {
      Alert.alert("Name fehlt", "Gib einen Fahrzeugnamen ein.");
      return;
    }

    const vehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      name: trimmedName,
      type: newVehicleType
    };

    setVehicles((currentVehicles) => [...currentVehicles, vehicle]);
    setSelectedVehicleId(vehicle.id);
    setNewVehicleName("");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <View style={styles.header}>
          <Image source={require("./carpin.png")} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.appName}>CarPin</Text>
            <Text style={styles.tagline}>Parkplatz merken. Stress sparen.</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TabButton label="Parken" isActive={screen === "dashboard"} onPress={() => setScreen("dashboard")} />
          <TabButton label="Timer" isActive={screen === "timer"} onPress={() => setScreen("timer")} />
          <TabButton label="Fahrzeuge" isActive={screen === "vehicles"} onPress={() => setScreen("vehicles")} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {screen === "dashboard" && (
            <View style={styles.stack}>
              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Aktives Fahrzeug</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleRow}>
                  {vehicles.map((vehicle) => (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[styles.vehicleChip, selectedVehicleId === vehicle.id && styles.vehicleChipActive]}
                      onPress={() => setSelectedVehicleId(vehicle.id)}
                    >
                      <Text style={[styles.vehicleChipText, selectedVehicleId === vehicle.id && styles.vehicleChipTextActive]}>
                        {vehicle.name}
                      </Text>
                      <Text style={styles.vehicleType}>{vehicle.type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>
                  {parkingSpot ? "Parkplatz gespeichert" : "Wo steht dein Fahrzeug?"}
                </Text>
                <Text style={styles.heroText}>
                  {parkingSpot
                    ? `Gespeichert fuer ${selectedVehicle?.name ?? "dein Fahrzeug"} um ${formatTime(parkingSpot.savedAt)}.`
                    : "Speichere deinen aktuellen Standort, wenn du parkiert hast."}
                </Text>

                {parkingSpot && (
                  <View style={styles.locationBox}>
                    <Text style={styles.locationLabel}>Standort</Text>
                    <Text style={styles.locationValue}>{parkingSpot.address || "Adresse noch nicht verfuegbar"}</Text>
                    <Text style={styles.locationMeta}>
                      {parkingSpot.latitude.toFixed(5)}, {parkingSpot.longitude.toFixed(5)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.primaryButton} onPress={saveParkingSpot} disabled={isSavingSpot}>
                  <Text style={styles.primaryButtonText}>
                    {isSavingSpot ? "Speichere..." : "Parkplatz speichern"}
                  </Text>
                </TouchableOpacity>

                {parkingSpot && (
                  <View style={styles.buttonGrid}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={openRoute}>
                      <Text style={styles.secondaryButtonText}>Route starten</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => pickPhoto("camera")}>
                      <Text style={styles.secondaryButtonText}>Foto machen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => pickPhoto("library")}>
                      <Text style={styles.secondaryButtonText}>Foto waehlen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.warningButton} onPress={() => setParkingSpot(null)}>
                      <Text style={styles.warningButtonText}>Loeschen</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {parkingSpot?.photoUri && (
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>Orientierungsfoto</Text>
                  <Image source={{ uri: parkingSpot.photoUri }} style={styles.parkingPhoto} />
                </View>
              )}
            </View>
          )}

          {screen === "timer" && (
            <View style={styles.stack}>
              <View style={styles.timerCircle}>
                <Text style={styles.timerValue}>{timerIsActive ? formatCountdown(remainingMs) : "0:00"}</Text>
                <Text style={styles.timerLabel}>
                  {timerIsActive && timerEnd ? `Laeuft bis ${formatTime(timerEnd)}` : "Kein aktiver Parktimer"}
                </Text>
              </View>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Parkdauer</Text>
                <View style={styles.buttonGrid}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => startTimer(30)}>
                    <Text style={styles.secondaryButtonText}>30 min</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => startTimer(60)}>
                    <Text style={styles.secondaryButtonText}>1 h</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => startTimer(120)}>
                    <Text style={styles.secondaryButtonText}>2 h</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.warningButton} onPress={() => setTimerEnd(null)}>
                    <Text style={styles.warningButtonText}>Stoppen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {screen === "vehicles" && (
            <View style={styles.stack}>
              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Neues Fahrzeug</Text>
                <TextInput
                  value={newVehicleName}
                  onChangeText={setNewVehicleName}
                  placeholder="z.B. Familienauto"
                  placeholderTextColor="#8d8173"
                  style={styles.input}
                />
                <View style={styles.typeRow}>
                  {VEHICLE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, newVehicleType === type && styles.typeChipActive]}
                      onPress={() => setNewVehicleType(type)}
                    >
                      <Text style={[styles.typeChipText, newVehicleType === type && styles.typeChipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={addVehicle}>
                  <Text style={styles.primaryButtonText}>Fahrzeug hinzufuegen</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Gespeicherte Fahrzeuge</Text>
                {vehicles.map((vehicle) => (
                  <View key={vehicle.id} style={styles.vehicleListItem}>
                    <View>
                      <Text style={styles.vehicleName}>{vehicle.name}</Text>
                      <Text style={styles.vehicleType}>{vehicle.type}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedVehicleId(vehicle.id)}>
                      <Text style={styles.linkText}>{selectedVehicleId === vehicle.id ? "Aktiv" : "Auswaehlen"}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type TabButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
};

function TabButton({ label, isActive, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity style={[styles.tabButton, isActive && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f2ea"
  },
  appShell: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 18
  },
  logo: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    height: 58,
    width: 58
  },
  appName: {
    color: "#23201d",
    fontSize: 28,
    fontWeight: "800"
  },
  tagline: {
    color: "#6b6258",
    fontSize: 14,
    marginTop: 2
  },
  tabs: {
    backgroundColor: "#e9ded0",
    borderRadius: 16,
    flexDirection: "row",
    gap: 6,
    padding: 5
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    paddingVertical: 10
  },
  tabButtonActive: {
    backgroundColor: "#ffffff"
  },
  tabText: {
    color: "#6b6258",
    fontSize: 14,
    fontWeight: "700"
  },
  tabTextActive: {
    color: "#23201d"
  },
  content: {
    paddingBottom: 30,
    paddingTop: 18
  },
  stack: {
    gap: 16
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#eadfce",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16
  },
  sectionTitle: {
    color: "#23201d",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12
  },
  vehicleRow: {
    gap: 10
  },
  vehicleChip: {
    backgroundColor: "#f5eee5",
    borderColor: "#eadfce",
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 132,
    padding: 12
  },
  vehicleChipActive: {
    backgroundColor: "#273f3b",
    borderColor: "#273f3b"
  },
  vehicleChipText: {
    color: "#23201d",
    fontSize: 15,
    fontWeight: "800"
  },
  vehicleChipTextActive: {
    color: "#ffffff"
  },
  vehicleType: {
    color: "#8d8173",
    fontSize: 12,
    marginTop: 4
  },
  heroCard: {
    backgroundColor: "#273f3b",
    borderRadius: 22,
    padding: 20
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 31
  },
  heroText: {
    color: "#d8e4df",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8
  },
  locationBox: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    padding: 14
  },
  locationLabel: {
    color: "#b9cfc6",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  locationValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6
  },
  locationMeta: {
    color: "#c8d8d1",
    fontSize: 13,
    marginTop: 5
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#e2b14d",
    borderRadius: 14,
    marginTop: 16,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#21180a",
    fontSize: 16,
    fontWeight: "900"
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    flexGrow: 1,
    minWidth: "46%",
    paddingVertical: 13
  },
  secondaryButtonText: {
    color: "#273f3b",
    fontSize: 14,
    fontWeight: "900"
  },
  warningButton: {
    alignItems: "center",
    backgroundColor: "#f3ddd5",
    borderRadius: 14,
    flexGrow: 1,
    minWidth: "46%",
    paddingVertical: 13
  },
  warningButtonText: {
    color: "#8a2d1e",
    fontSize: 14,
    fontWeight: "900"
  },
  parkingPhoto: {
    aspectRatio: 1.45,
    borderRadius: 16,
    width: "100%"
  },
  timerCircle: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#273f3b",
    borderRadius: 110,
    height: 220,
    justifyContent: "center",
    width: 220
  },
  timerValue: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "900"
  },
  timerLabel: {
    color: "#c8d8d1",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    width: 160
  },
  input: {
    backgroundColor: "#f7f2ea",
    borderColor: "#eadfce",
    borderRadius: 14,
    borderWidth: 1,
    color: "#23201d",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  typeChip: {
    backgroundColor: "#f5eee5",
    borderColor: "#eadfce",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  typeChipActive: {
    backgroundColor: "#273f3b",
    borderColor: "#273f3b"
  },
  typeChipText: {
    color: "#6b6258",
    fontSize: 13,
    fontWeight: "800"
  },
  typeChipTextActive: {
    color: "#ffffff"
  },
  vehicleListItem: {
    alignItems: "center",
    borderTopColor: "#f0e5d7",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12
  },
  vehicleName: {
    color: "#23201d",
    fontSize: 16,
    fontWeight: "800"
  },
  linkText: {
    color: "#2f665d",
    fontSize: 14,
    fontWeight: "900"
  }
});
