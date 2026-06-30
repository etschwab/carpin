import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  PanResponder,
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

type Coordinate = {
  latitude: number;
  longitude: number;
};

type ParkingSpot = Coordinate & {
  id: string;
  vehicleId: string;
  savedAt: string;
  address?: string;
  photoUri?: string;
};

type Screen = "dashboard" | "timer" | "vehicles";
type SheetMode = "compact" | "mid" | "full";

const STORAGE_KEYS = {
  vehicles: "carpin:vehicles",
  parkingSpot: "carpin:parkingSpot",
  timerEnd: "carpin:timerEnd",
  timerStartedAt: "carpin:timerStartedAt",
  timerSpotId: "carpin:timerSpotId"
};

const VEHICLE_TYPES: VehicleType[] = ["Auto", "Fahrrad", "Motorrad", "Scooter"];

const DEFAULT_VEHICLES: Vehicle[] = [
  { id: "vehicle-auto", name: "VW Golf", type: "Auto" },
  { id: "vehicle-bike", name: "Tims Fahrrad", type: "Fahrrad" }
];

const FALLBACK_COORDINATE: Coordinate = {
  latitude: 47.3769,
  longitude: 8.5417
};
const SHEET_HEIGHTS: Record<SheetMode, number> = {
  compact: 112,
  mid: 306,
  full: Math.round(Dimensions.get("window").height * 0.86)
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

function parseMinutes(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return null;
  }

  return Math.min(parsed, 24 * 60);
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
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>("Auto");
  const [timerEnd, setTimerEnd] = useState<string | null>(null);
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const [timerSpotId, setTimerSpotId] = useState<string | null>(null);
  const [customTimerMinutes, setCustomTimerMinutes] = useState("90");
  const [now, setNow] = useState(Date.now());
  const [isSavingSpot, setIsSavingSpot] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isPhotoVisible, setIsPhotoVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("mid");
  const sheetHeight = useRef(new Animated.Value(SHEET_HEIGHTS.mid)).current;

  useEffect(() => {
    async function loadState() {
      const [storedVehicles, storedParkingSpot, storedTimerEnd, storedTimerStartedAt, storedTimerSpotId] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.vehicles),
          AsyncStorage.getItem(STORAGE_KEYS.parkingSpot),
          AsyncStorage.getItem(STORAGE_KEYS.timerEnd),
          AsyncStorage.getItem(STORAGE_KEYS.timerStartedAt),
          AsyncStorage.getItem(STORAGE_KEYS.timerSpotId)
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

      if (storedTimerStartedAt) {
        setTimerStartedAt(storedTimerStartedAt);
      }

      if (storedTimerSpotId) {
        setTimerSpotId(storedTimerSpotId);
      }
    }

    loadState().catch(() => {
      Alert.alert("Speicherfehler", "Die lokalen Daten konnten nicht gelesen werden.");
    });
    refreshCurrentLocation(true).catch(() => undefined);
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
    if (timerStartedAt) {
      AsyncStorage.setItem(STORAGE_KEYS.timerStartedAt, timerStartedAt).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.timerStartedAt).catch(() => undefined);
    }
  }, [timerStartedAt]);

  useEffect(() => {
    if (timerSpotId) {
      AsyncStorage.setItem(STORAGE_KEYS.timerSpotId, timerSpotId).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.timerSpotId).catch(() => undefined);
    }
  }, [timerSpotId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.spring(sheetHeight, {
      toValue: SHEET_HEIGHTS[sheetMode],
      damping: 24,
      mass: 0.9,
      stiffness: 190,
      useNativeDriver: false
    }).start();
  }, [sheetHeight, sheetMode]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0],
    [selectedVehicleId, vehicles]
  );

  const timerSpotMatchesActiveSpot = Boolean(parkingSpot && timerSpotId === parkingSpot.id);
  const remainingMs = timerEnd ? new Date(timerEnd).getTime() - now : 0;
  const timerIsActive = Boolean(timerEnd && remainingMs > 0);
  const activeMapCoordinate = parkingSpot ?? currentLocation ?? FALLBACK_COORDINATE;
  const mapRegion: Region = {
    latitude: activeMapCoordinate.latitude,
    longitude: activeMapCoordinate.longitude,
    latitudeDelta: parkingSpot ? 0.006 : 0.012,
    longitudeDelta: parkingSpot ? 0.006 : 0.012
  };
  const currentAddressLabel = parkingSpot?.address || (currentLocation ? "Aktueller Standort" : "Standort wird gesucht");
  const coordinateLabel = `${activeMapCoordinate.latitude.toFixed(5)}, ${activeMapCoordinate.longitude.toFixed(5)}`;
  const bottomSheetAnimatedStyle = { height: sheetHeight };
  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 8,
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy < -40) {
            setSheetMode((currentMode) => (currentMode === "compact" ? "mid" : "full"));
            return;
          }

          if (gesture.dy > 40) {
            setSheetMode((currentMode) => (currentMode === "full" ? "mid" : "compact"));
          }
        }
      }),
    []
  );

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

      setCurrentLocation(coordinate);
      return coordinate;
    } catch {
      if (showErrors) {
        Alert.alert("Standortfehler", "Dein aktueller Standort konnte nicht gelesen werden.");
      }
      return null;
    } finally {
      setIsLocating(false);
    }
  }

  async function refreshCurrentLocation(silent = false) {
    return getDeviceLocation(!silent);
  }

  async function saveParkingSpot() {
    if (!selectedVehicle) {
      Alert.alert("Kein Fahrzeug", "Bitte füge zuerst ein Fahrzeug hinzu.");
      setScreen("vehicles");
      return;
    }

    setIsSavingSpot(true);

    try {
      const coordinate = await getDeviceLocation(true);
      if (!coordinate) {
        return;
      }

      const address = await reverseGeocode(coordinate.latitude, coordinate.longitude);

      setParkingSpot({
        id: String(Date.now()),
        vehicleId: selectedVehicle.id,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address || "Gespeicherter Parkplatz",
        savedAt: new Date().toISOString()
      });

      Alert.alert("Parkplatz gespeichert", "Dein aktueller Standort wurde in der Karte gespeichert.");
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
    if (!parkingSpot) {
      Alert.alert("Kein Parkplatz", "Speichere zuerst einen Parkplatz, damit der Timer zugeteilt werden kann.");
      setScreen("dashboard");
      return;
    }

    const start = new Date().toISOString();
    const end = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setTimerStartedAt(start);
    setTimerEnd(end);
    setTimerSpotId(parkingSpot.id);
    setScreen("timer");
  }

  function startCustomTimer() {
    const minutes = parseMinutes(customTimerMinutes);
    if (!minutes) {
      Alert.alert("Ungültige Zeit", "Gib eine Parkdauer in Minuten ein.");
      return;
    }

    startTimer(minutes);
  }

  function clearParkingSpot() {
    if (parkingSpot?.id === timerSpotId) {
      setTimerEnd(null);
      setTimerStartedAt(null);
      setTimerSpotId(null);
    }

    setParkingSpot(null);
    setIsPhotoVisible(false);
  }

  function toggleSheetMode() {
    setSheetMode((currentMode) => {
      if (currentMode === "compact") {
        return "mid";
      }

      if (currentMode === "mid") {
        return "full";
      }

      return "compact";
    });
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

  function deleteVehicle(vehicleId: string) {
    const vehicle = vehicles.find((currentVehicle) => currentVehicle.id === vehicleId);
    if (!vehicle) {
      return;
    }

    if (parkingSpot?.vehicleId === vehicleId) {
      Alert.alert(
        "Fahrzeug wird verwendet",
        "Dieses Fahrzeug hat gerade einen gespeicherten Parkplatz. Beende zuerst das Parking."
      );
      return;
    }

    if (vehicles.length === 1) {
      Alert.alert("Nicht möglich", "Mindestens ein Fahrzeug muss gespeichert bleiben.");
      return;
    }

    Alert.alert("Fahrzeug löschen", `${vehicle.name} wirklich entfernen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: () => {
          const remainingVehicles = vehicles.filter((currentVehicle) => currentVehicle.id !== vehicleId);
          setVehicles(remainingVehicles);

          if (selectedVehicleId === vehicleId) {
            setSelectedVehicleId(remainingVehicles[0]?.id ?? DEFAULT_VEHICLES[0].id);
          }
        }
      }
    ]);
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
            <CarPinMap
              currentLocation={currentLocation}
              isLocating={isLocating}
              onRefreshLocation={() => refreshCurrentLocation(false)}
              parkingSpot={parkingSpot}
              region={mapRegion}
            />

            <Animated.View style={[styles.bottomSheet, bottomSheetAnimatedStyle]}>
              <View style={styles.sheetHandleArea} {...sheetPanResponder.panHandlers}>
                <TouchableOpacity style={styles.handleTapTarget} onPress={toggleSheetMode}>
                  <View style={styles.handle} />
                  <Text style={styles.sheetHint}>
                    {sheetMode === "full" ? "Nach unten ziehen" : sheetMode === "compact" ? "Nach oben ziehen" : "Ziehen für Vollbild"}
                  </Text>
                </TouchableOpacity>
              </View>

              {sheetMode === "compact" ? (
                <TouchableOpacity
                  style={parkingSpot ? styles.endParkingButton : styles.primaryButton}
                  onPress={parkingSpot ? clearParkingSpot : saveParkingSpot}
                  disabled={isSavingSpot}
                >
                  <Text style={parkingSpot ? styles.endParkingButtonText : styles.primaryButtonText}>
                    {parkingSpot ? "Parking beenden" : isSavingSpot ? "Speichere..." : "Parkplatz speichern"}
                  </Text>
                </TouchableOpacity>
              ) : sheetMode === "full" ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.fullSheetContent}>
                  <View style={styles.fullHeaderCard}>
                    <View style={styles.fullHeaderIcon}>
                      <Text style={styles.fullHeaderIconText}>P</Text>
                    </View>
                    <View style={styles.fullHeaderText}>
                      <Text style={styles.savedEyebrow}>{parkingSpot ? "Parking aktiv" : "Bereit zum Speichern"}</Text>
                      <Text style={styles.fullAddressTitle}>{currentAddressLabel}</Text>
                      <Text style={styles.savedMeta}>
                        {parkingSpot
                          ? `${selectedVehicle?.name ?? "Fahrzeug"} · ${formatTime(parkingSpot.savedAt)}`
                          : `${selectedVehicle?.name ?? "Fahrzeug"} · Standort prüfen und Parkplatz speichern`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.fullIconGrid}>
                    <FullInfoTile icon="⌖" label="Standort" value={coordinateLabel} />
                    <FullInfoTile icon="A" label="Fahrzeug" value={selectedVehicle?.name ?? "Kein Fahrzeug"} />
                    <FullInfoTile
                      icon="⏱"
                      label="Timer"
                      value={parkingSpot && timerSpotMatchesActiveSpot && timerIsActive ? formatCountdown(remainingMs) : "nicht gesetzt"}
                    />
                    <FullInfoTile icon="▣" label="Foto" value={parkingSpot?.photoUri ? "gespeichert" : "noch offen"} />
                  </View>

                  <View style={styles.fullActionPanel}>
                    {parkingSpot ? (
                      <>
                        <TouchableOpacity style={styles.primaryButton} onPress={openRoute}>
                          <Text style={styles.primaryButtonText}>Zurück zum Auto</Text>
                        </TouchableOpacity>
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.darkButton} onPress={() => pickPhoto("camera")}>
                            <Text style={styles.darkButtonText}>Foto aufnehmen</Text>
                          </TouchableOpacity>
                          {parkingSpot.photoUri ? (
                            <TouchableOpacity style={styles.darkButton} onPress={() => setIsPhotoVisible(true)}>
                              <Text style={styles.darkButtonText}>Foto anzeigen</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity style={styles.darkButton} onPress={() => pickPhoto("library")}>
                              <Text style={styles.darkButtonText}>Galerie</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <TouchableOpacity style={styles.timerShortcut} onPress={() => setScreen("timer")}>
                          <Text style={styles.timerShortcutText}>Parktimer für diesen Parkplatz setzen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.endParkingButton} onPress={clearParkingSpot}>
                          <Text style={styles.endParkingButtonText}>Parking beenden</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={styles.primaryButton} onPress={saveParkingSpot} disabled={isSavingSpot}>
                        <Text style={styles.primaryButtonText}>{isSavingSpot ? "Speichere..." : "Parkplatz speichern"}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              ) : parkingSpot ? (
                <>
                  <View style={styles.savedCard}>
                    <Text style={styles.savedEyebrow}>Parkplatz gespeichert</Text>
                    <Text style={styles.savedTitle}>{parkingSpot.address || "Gespeicherter Parkplatz"}</Text>
                    <Text style={styles.savedMeta}>
                      {selectedVehicle?.name ?? "Fahrzeug"} · Heute, {formatTime(parkingSpot.savedAt).split(",").pop()?.trim()}
                    </Text>
                  </View>

                  <View style={styles.metricsRow}>
                    <Metric label="Timer" value={timerSpotMatchesActiveSpot && timerIsActive ? formatCountdown(remainingMs) : "nicht gesetzt"} />
                    <Metric label="Foto" value={parkingSpot.photoUri ? "gespeichert" : "offen"} />
                    <Metric label="Route" value="Apple Maps" />
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.darkButton} onPress={() => pickPhoto("camera")}>
                      <Text style={styles.darkButtonText}>Foto aufnehmen</Text>
                    </TouchableOpacity>
                    {parkingSpot.photoUri ? (
                      <TouchableOpacity style={styles.darkButton} onPress={() => setIsPhotoVisible(true)}>
                        <Text style={styles.darkButtonText}>Foto anzeigen</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.darkButton} onPress={() => pickPhoto("library")}>
                        <Text style={styles.darkButtonText}>Galerie</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.primaryButtonSmall} onPress={openRoute}>
                      <Text style={styles.primaryButtonText}>Zurück zum Auto</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.timerShortcut} onPress={() => setScreen("timer")}>
                    <Text style={styles.timerShortcutText}>Parktimer für diesen Parkplatz setzen</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.endParkingButton} onPress={clearParkingSpot}>
                    <Text style={styles.endParkingButtonText}>Parking beenden</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.lastSavedCard}>
                    <View style={styles.pinBadge}>
                      <Text style={styles.pinBadgeText}>P</Text>
                    </View>
                    <View style={styles.lastSavedContent}>
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
            </Animated.View>
          </View>
        )}

        {screen === "timer" && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.timerRing}>
              <View style={styles.timerArc} />
              <Text style={styles.timerLabel}>Verbleibend</Text>
              <Text style={styles.timerValue}>{timerIsActive ? formatCountdown(remainingMs) : "0:00:00"}</Text>
              <Text style={styles.timerUnit}>Std</Text>
            </View>

            <View style={styles.assignmentCard}>
              <Text style={styles.assignmentLabel}>Zugewiesener Parkplatz</Text>
              <Text style={styles.assignmentTitle}>
                {parkingSpot ? parkingSpot.address || "Gespeicherter Parkplatz" : "Noch kein Parkplatz gespeichert"}
              </Text>
              <Text style={styles.assignmentMeta}>
                {timerSpotMatchesActiveSpot && timerStartedAt
                  ? `Gestartet ${formatTime(timerStartedAt)} · Endet ${timerEnd ? formatTime(timerEnd) : "-"}`
                  : "Timer wird beim Start diesem Parkplatz zugeteilt."}
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

            <View style={styles.customTimerRow}>
              <TextInput
                keyboardType="number-pad"
                maxLength={4}
                onChangeText={setCustomTimerMinutes}
                placeholder="Minuten"
                placeholderTextColor="#777589"
                style={styles.timerInput}
                value={customTimerMinutes}
              />
              <TouchableOpacity style={styles.customTimerButton} onPress={startCustomTimer}>
                <Text style={styles.customTimerButtonText}>Benutzerdefiniert starten</Text>
              </TouchableOpacity>
            </View>
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
                  <View style={styles.vehicleActions}>
                    <TouchableOpacity onPress={() => setSelectedVehicleId(vehicle.id)}>
                      <Text style={styles.linkText}>{selectedVehicleId === vehicle.id ? "Aktiv" : "Auswählen"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteVehicle(vehicle.id)}>
                      <Text style={styles.deleteText}>Löschen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <Modal visible={isPhotoVisible} animationType="slide" transparent onRequestClose={() => setIsPhotoVisible(false)}>
        <View style={styles.photoModalBackdrop}>
          <View style={styles.photoModal}>
            <Text style={styles.photoModalTitle}>Parkplatzfoto</Text>
            {parkingSpot?.photoUri && <Image source={{ uri: parkingSpot.photoUri }} style={styles.photoPreview} />}
            <TouchableOpacity style={styles.primaryButton} onPress={() => setIsPhotoVisible(false)}>
              <Text style={styles.primaryButtonText}>Schliessen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  currentLocation: Coordinate | null;
  isLocating: boolean;
  onRefreshLocation: () => void;
  parkingSpot: ParkingSpot | null;
  region: Region;
};

function CarPinMap({ currentLocation, isLocating, onRefreshLocation, parkingSpot, region }: CarPinMapProps) {
  const parkingCoordinate = parkingSpot
    ? { latitude: parkingSpot.latitude, longitude: parkingSpot.longitude }
    : null;
  const routeCoordinates = currentLocation && parkingCoordinate ? [currentLocation, parkingCoordinate] : [];

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
        {currentLocation && (
          <Marker coordinate={currentLocation} title="Dein Standort">
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {parkingCoordinate && (
          <>
            {routeCoordinates.length === 2 && (
              <Polyline coordinates={routeCoordinates} strokeColor="#20c8f4" strokeWidth={5} />
            )}
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
          {parkingSpot?.address || (currentLocation ? "Aktueller Standort" : "Standort wird gesucht")}
        </Text>
      </View>

      <TouchableOpacity style={styles.locationButton} onPress={onRefreshLocation} disabled={isLocating}>
        <Text style={styles.locationButtonText}>{isLocating ? "..." : "Standort"}</Text>
      </TouchableOpacity>
    </View>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

type FullInfoTileProps = {
  icon: string;
  label: string;
  value: string;
};

function FullInfoTile({ icon, label, value }: FullInfoTileProps) {
  return (
    <View style={styles.fullInfoTile}>
      <View style={styles.fullInfoIcon}>
        <Text style={styles.fullInfoIconText}>{icon}</Text>
      </View>
      <Text style={styles.fullInfoLabel}>{label}</Text>
      <Text style={styles.fullInfoValue}>{value}</Text>
    </View>
  );
}

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
    maxWidth: 245,
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
  locationButton: {
    alignItems: "center",
    backgroundColor: "rgba(17, 17, 29, 0.92)",
    borderColor: "#242439",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "absolute",
    right: 16,
    top: 18
  },
  locationButtonText: {
    color: "#20c8f4",
    fontSize: 12,
    fontWeight: "900"
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
    overflow: "hidden",
    padding: 16,
    paddingBottom: 20,
    position: "absolute",
    right: 0
  },
  sheetHandleArea: {
    marginBottom: 12
  },
  handleTapTarget: {
    alignItems: "center",
    paddingBottom: 2,
    paddingTop: 2
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#414154",
    borderRadius: 2,
    height: 4,
    marginBottom: 7,
    width: 38
  },
  sheetHint: {
    color: "#777589",
    fontSize: 11,
    fontWeight: "800"
  },
  fullSheetContent: {
    paddingBottom: 26
  },
  fullHeaderCard: {
    alignItems: "center",
    backgroundColor: "#0e3448",
    borderColor: "#176783",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 16
  },
  fullHeaderIcon: {
    alignItems: "center",
    backgroundColor: "#20c8f4",
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  fullHeaderIconText: {
    color: "#071018",
    fontSize: 22,
    fontWeight: "900"
  },
  fullHeaderText: {
    flex: 1
  },
  fullAddressTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
    marginTop: 8
  },
  fullIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  fullInfoTile: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 112,
    padding: 13,
    width: "48%"
  },
  fullInfoIcon: {
    alignItems: "center",
    backgroundColor: "#073f59",
    borderRadius: 12,
    height: 32,
    justifyContent: "center",
    marginBottom: 10,
    width: 32
  },
  fullInfoIconText: {
    color: "#20c8f4",
    fontSize: 15,
    fontWeight: "900"
  },
  fullInfoLabel: {
    color: "#777589",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  fullInfoValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
    marginTop: 5
  },
  fullActionPanel: {
    marginTop: 4
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
  lastSavedContent: {
    flex: 1
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
    flex: 1.25,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#071018",
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: "900",
    marginTop: 3,
    textAlign: "center"
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
    flex: 0.85,
    paddingVertical: 14
  },
  darkButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  },
  timerShortcut: {
    alignItems: "center",
    backgroundColor: "#0e3448",
    borderColor: "#176783",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 13
  },
  timerShortcutText: {
    color: "#20c8f4",
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
  endParkingButton: {
    alignItems: "center",
    backgroundColor: "#2b1b23",
    borderColor: "#6f2b3c",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 15
  },
  endParkingButtonText: {
    color: "#ff8a9a",
    fontSize: 14,
    fontWeight: "900"
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
    fontSize: 34,
    fontWeight: "900",
    marginTop: 2
  },
  timerUnit: {
    color: "#20c8f4",
    fontSize: 12,
    fontWeight: "900"
  },
  assignmentCard: {
    backgroundColor: "#151523",
    borderColor: "#242439",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 28,
    padding: 16
  },
  assignmentLabel: {
    color: "#20c8f4",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  assignmentTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 8
  },
  assignmentMeta: {
    color: "#9aa8b6",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6
  },
  sectionLabel: {
    color: "#777589",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 24,
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
  customTimerRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  timerInput: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    color: "#ffffff",
    flex: 0.55,
    fontSize: 15,
    fontWeight: "900",
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  customTimerButton: {
    alignItems: "center",
    backgroundColor: "#20c8f4",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  customTimerButtonText: {
    color: "#071018",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
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
  vehicleActions: {
    alignItems: "flex-end",
    gap: 8
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
  },
  deleteText: {
    color: "#ff6b6b",
    fontSize: 13,
    fontWeight: "900"
  },
  photoModalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.74)",
    flex: 1,
    justifyContent: "flex-end"
  },
  photoModal: {
    backgroundColor: "#11111d",
    borderColor: "#242439",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 28
  },
  photoModalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14
  },
  photoPreview: {
    aspectRatio: 1.1,
    borderRadius: 18,
    width: "100%"
  }
});
