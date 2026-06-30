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
import MapView, { Marker, Polyline, Region } from "react-native-maps";

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

const FALLBACK_COORDINATE = {
  latitude: 47.3769,
  longitude: 8.5417
};

const MAP_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#151523" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b7b5c8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d0d19" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#25253a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#11111d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#073f59" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#143b32" }] }
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

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
  const mapRegion: Region = {
    latitude: parkingSpot?.latitude ?? FALLBACK_COORDINATE.latitude,
    longitude: parkingSpot?.longitude ?? FALLBACK_COORDINATE.longitude,
    latitudeDelta: parkingSpot ? 0.006 : 0.02,
    longitudeDelta: parkingSpot ? 0.006 : 0.02
  };

  async function saveParkingSpot() {
    if (!selectedVehicle) {
      Alert.alert("Kein Fahrzeug", "Bitte füge zuerst ein Fahrzeug hinzu.");
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
        address: address || "Gespeicherter Parkplatz",
        savedAt: new Date().toISOString()
      });

      Alert.alert("Parkplatz gespeichert", "Dein Standort wurde in der Kartenansicht markiert.");
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
      Alert.alert("Route nicht möglich", "Apple Maps konnte nicht geöffnet werden.");
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
      <StatusBar style="light" />
      <View style={styles.appShell}>
        <Header title={screen === "timer" ? "Parktimer" : screen === "vehicles" ? "Fahrzeuge" : "CarPin"} />

        <View style={styles.tabs}>
          <TabButton label="Parken" isActive={screen === "dashboard"} onPress={() => setScreen("dashboard")} />
          <TabButton label="Timer" isActive={screen === "timer"} onPress={() => setScreen("timer")} />
          <TabButton label="Fahrzeuge" isActive={screen === "vehicles"} onPress={() => setScreen("vehicles")} />
        </View>

        {screen === "dashboard" && (
          <View style={styles.mapScreen}>
            <CarPinMap parkingSpot={parkingSpot} region={mapRegion} />

            <View style={styles.bottomSheet}>
              <View style={styles.handle} />

              {parkingSpot ? (
                <>
                  <View style={styles.savedCard}>
                    <Text style={styles.savedEyebrow}>Parkplatz gespeichert</Text>
                    <Text style={styles.savedTitle}>{parkingSpot.address || "Gespeicherter Parkplatz"}</Text>
                    <Text style={styles.savedMeta}>
                      {selectedVehicle?.name ?? "Fahrzeug"} · Heute, {formatTime(parkingSpot.savedAt).split(",").pop()?.trim()}
                    </Text>
                  </View>

                  <View style={styles.metricsRow}>
                    <Metric label="Entfernung" value="340 m" />
                    <Metric label="Gehzeit" value="~4 min" />
                    <Metric label="Parkdauer" value={timerIsActive ? formatCountdown(remainingMs) : "0:12"} />
                  </View>

                  {parkingSpot.photoUri && <Image source={{ uri: parkingSpot.photoUri }} style={styles.parkingPhoto} />}

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.darkButton} onPress={() => pickPhoto("camera")}>
                      <Text style={styles.darkButtonText}>Foto aufnehmen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.darkButton} onPress={() => pickPhoto("library")}>
                      <Text style={styles.darkButtonText}>Galerie</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButtonSmall} onPress={openRoute}>
                      <Text style={styles.primaryButtonText}>Zurück zum Auto</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.ghostButton} onPress={() => setParkingSpot(null)}>
                    <Text style={styles.ghostButtonText}>Parkplatz löschen</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.lastSavedCard}>
                    <View style={styles.pinBadge}>
                      <Text style={styles.pinBadgeText}>P</Text>
                    </View>
                    <View>
                      <Text style={styles.lastSavedLabel}>Aktives Fahrzeug</Text>
                      <Text style={styles.lastSavedText}>{selectedVehicle?.name ?? "Noch kein Fahrzeug"}</Text>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleStrip}>
                    {vehicles.map((vehicle) => (
                      <TouchableOpacity
                        key={vehicle.id}
                        style={[styles.vehiclePill, selectedVehicleId === vehicle.id && styles.vehiclePillActive]}
                        onPress={() => setSelectedVehicleId(vehicle.id)}
                      >
                        <Text style={[styles.vehiclePillText, selectedVehicleId === vehicle.id && styles.vehiclePillTextActive]}>
                          {vehicle.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TouchableOpacity style={styles.primaryButton} onPress={saveParkingSpot} disabled={isSavingSpot}>
                    <Text style={styles.primaryButtonText}>{isSavingSpot ? "Speichere..." : "Parkplatz speichern"}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {screen === "timer" && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.timerRing}>
              <View style={styles.timerArc} />
              <Text style={styles.timerLabel}>Verbleibend</Text>
              <Text style={styles.timerValue}>{timerIsActive ? formatCountdown(remainingMs) : "1:00"}</Text>
              <Text style={styles.timerUnit}>Std</Text>
            </View>

            <View style={styles.timerInfo}>
              <Text style={styles.timerInfoText}>
                {timerEnd ? `Endet ${formatTime(timerEnd)}` : "Kein aktiver Timer"}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Parkzeit wählen</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity style={styles.timeButton} onPress={() => startTimer(30)}>
                <Text style={styles.timeButtonText}>30 min</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.timeButton, styles.timeButtonActive]} onPress={() => startTimer(60)}>
                <Text style={styles.timeButtonTextActive}>1 h</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeButton} onPress={() => startTimer(120)}>
                <Text style={styles.timeButtonText}>2 h</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => startTimer(60)}>
              <Text style={styles.primaryButtonText}>1 h Timer starten</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {screen === "vehicles" && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Neues Fahrzeug</Text>
              <TextInput
                value={newVehicleName}
                onChangeText={setNewVehicleName}
                placeholder="z.B. Familienauto"
                placeholderTextColor="#777589"
                style={styles.input}
              />
              <View style={styles.typeRow}>
                {VEHICLE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, newVehicleType === type && styles.typeChipActive]}
                    onPress={() => setNewVehicleType(type)}
                  >
                    <Text style={[styles.typeChipText, newVehicleType === type && styles.typeChipTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={addVehicle}>
                <Text style={styles.primaryButtonText}>Fahrzeug hinzufügen</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Gespeicherte Fahrzeuge</Text>
              {vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleListItem}>
                  <View>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleType}>{vehicle.type}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedVehicleId(vehicle.id)}>
                    <Text style={styles.linkText}>{selectedVehicleId === vehicle.id ? "Aktiv" : "Auswählen"}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

type HeaderProps = {
  title: string;
};

function Header({ title }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image source={require("./carpin.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    </View>
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

type CarPinMapProps = {
  parkingSpot: ParkingSpot | null;
  region: Region;
};

function CarPinMap({ parkingSpot, region }: CarPinMapProps) {
  const userCoordinate = {
    latitude: region.latitude - 0.0016,
    longitude: region.longitude - 0.0014
  };
  const parkingCoordinate = parkingSpot
    ? { latitude: parkingSpot.latitude, longitude: parkingSpot.longitude }
    : null;

  return (
    <View style={styles.mapCard}>
      <MapView
        style={styles.realMap}
        initialRegion={region}
        region={region}
        customMapStyle={MAP_DARK_STYLE}
        showsCompass={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
      >
        <Marker coordinate={userCoordinate} title="Dein Standort">
          <View style={styles.userMarker}>
            <View style={styles.userMarkerInner} />
          </View>
        </Marker>

        {parkingCoordinate && (
          <>
            <Polyline coordinates={[userCoordinate, parkingCoordinate]} strokeColor="#20c8f4" strokeWidth={5} />
            <Marker coordinate={parkingCoordinate} title="Parkplatz">
              <View style={styles.parkingMarker}>
                <Text style={styles.parkingMarkerText}>P</Text>
              </View>
            </Marker>
          </>
        )}
      </MapView>

      <View style={styles.mapOverlayLabel}>
        <Text style={styles.mapOverlayEyebrow}>Kartenansicht</Text>
        <Text style={styles.mapOverlayText}>
          {parkingSpot ? parkingSpot.address || "Parkplatz gespeichert" : "Zürich"}
        </Text>
      </View>
    </View>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#080911"
  },
  appShell: {
    flex: 1,
    backgroundColor: "#0d0d19",
    paddingHorizontal: 16,
    paddingTop: 8
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  logo: {
    borderRadius: 14,
    height: 34,
    width: 34
  },
  headerTitle: {
    color: "#f7f8ff",
    fontSize: 18,
    fontWeight: "900"
  },
  tabs: {
    backgroundColor: "#151523",
    borderColor: "#242439",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    padding: 5
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 13,
    flex: 1,
    paddingVertical: 10
  },
  tabButtonActive: {
    backgroundColor: "#20c8f4"
  },
  tabText: {
    color: "#9c9aac",
    fontSize: 13,
    fontWeight: "800"
  },
  tabTextActive: {
    color: "#071018"
  },
  mapScreen: {
    flex: 1,
    marginHorizontal: -16
  },
  mapCard: {
    flex: 1,
    minHeight: 520,
    overflow: "hidden",
    position: "relative"
  },
  realMap: {
    ...StyleSheet.absoluteFillObject
  },
  mapOverlayLabel: {
    backgroundColor: "rgba(17, 17, 29, 0.92)",
    borderColor: "#242439",
    borderRadius: 18,
    borderWidth: 1,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    position: "absolute",
    top: 14
  },
  mapOverlayEyebrow: {
    color: "#20c8f4",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  mapOverlayText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3
  },
  userMarker: {
    alignItems: "center",
    backgroundColor: "rgba(32, 200, 244, 0.22)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  userMarkerInner: {
    backgroundColor: "#20c8f4",
    borderColor: "#ffffff",
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    width: 14
  },
  parkingMarker: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#20c8f4",
    borderRadius: 18,
    borderWidth: 3,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  parkingMarkerText: {
    color: "#071018",
    fontSize: 15,
    fontWeight: "900"
  },
  bottomSheet: {
    backgroundColor: "#11111d",
    borderColor: "#222238",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    padding: 16,
    paddingBottom: 20,
    position: "absolute",
    right: 0
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#414154",
    borderRadius: 2,
    height: 4,
    marginBottom: 16,
    width: 38
  },
  lastSavedCard: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14
  },
  pinBadge: {
    alignItems: "center",
    backgroundColor: "#073f59",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  pinBadgeText: {
    color: "#20c8f4",
    fontSize: 18,
    fontWeight: "900"
  },
  lastSavedLabel: {
    color: "#777589",
    fontSize: 12,
    fontWeight: "800"
  },
  lastSavedText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4
  },
  vehicleStrip: {
    gap: 8,
    marginTop: 14
  },
  vehiclePill: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  vehiclePillActive: {
    backgroundColor: "#20c8f4"
  },
  vehiclePillText: {
    color: "#b7b5c8",
    fontSize: 12,
    fontWeight: "900"
  },
  vehiclePillTextActive: {
    color: "#071018"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#20c8f4",
    borderRadius: 16,
    marginTop: 14,
    paddingVertical: 16
  },
  primaryButtonSmall: {
    alignItems: "center",
    backgroundColor: "#20c8f4",
    borderRadius: 14,
    flex: 1.2,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#071018",
    fontSize: 15,
    fontWeight: "900"
  },
  savedCard: {
    backgroundColor: "#0e3448",
    borderColor: "#176783",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14
  },
  savedEyebrow: {
    color: "#20c8f4",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  savedTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8
  },
  savedMeta: {
    color: "#9aa8b6",
    fontSize: 13,
    marginTop: 5
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  metric: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 12
  },
  metricLabel: {
    color: "#777589",
    fontSize: 10,
    fontWeight: "800"
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3
  },
  parkingPhoto: {
    borderRadius: 16,
    height: 130,
    marginTop: 12,
    width: "100%"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  darkButton: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    flex: 0.9,
    paddingVertical: 14
  },
  darkButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  },
  ghostButton: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8
  },
  ghostButtonText: {
    color: "#777589",
    fontSize: 12,
    fontWeight: "800"
  },
  content: {
    paddingBottom: 28
  },
  timerRing: {
    alignItems: "center",
    alignSelf: "center",
    borderColor: "#1d1d2b",
    borderRadius: 82,
    borderWidth: 8,
    height: 164,
    justifyContent: "center",
    marginTop: 26,
    width: 164
  },
  timerArc: {
    borderColor: "#20c8f4",
    borderRadius: 82,
    borderRightWidth: 8,
    borderTopWidth: 8,
    height: 164,
    position: "absolute",
    transform: [{ rotate: "20deg" }],
    width: 164
  },
  timerLabel: {
    color: "#777589",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  timerValue: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 2
  },
  timerUnit: {
    color: "#20c8f4",
    fontSize: 12,
    fontWeight: "900"
  },
  timerInfo: {
    alignSelf: "center",
    backgroundColor: "#0e3448",
    borderColor: "#176783",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 28,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  timerInfoText: {
    color: "#b8d7e5",
    fontSize: 12,
    fontWeight: "800"
  },
  sectionLabel: {
    color: "#777589",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 30,
    textTransform: "uppercase"
  },
  timeButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  timeButton: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 15
  },
  timeButtonActive: {
    backgroundColor: "#20c8f4",
    borderColor: "#20c8f4"
  },
  timeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  timeButtonTextActive: {
    color: "#071018",
    fontSize: 14,
    fontWeight: "900"
  },
  panel: {
    backgroundColor: "#151523",
    borderColor: "#242439",
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14
  },
  input: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    color: "#ffffff",
    fontSize: 15,
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
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  typeChipActive: {
    backgroundColor: "#20c8f4",
    borderColor: "#20c8f4"
  },
  typeChipText: {
    color: "#b7b5c8",
    fontSize: 13,
    fontWeight: "900"
  },
  typeChipTextActive: {
    color: "#071018"
  },
  vehicleListItem: {
    alignItems: "center",
    borderTopColor: "#242439",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13
  },
  vehicleName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  },
  vehicleType: {
    color: "#777589",
    fontSize: 12,
    marginTop: 4
  },
  linkText: {
    color: "#20c8f4",
    fontSize: 14,
    fontWeight: "900"
  }
});
