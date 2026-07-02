import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Linking, PanResponder, Platform, SafeAreaView, Share, View } from "react-native";
import type { Region } from "react-native-maps";

import { Header } from "./src/components/Header";
import { TabButton } from "./src/components/TabButton";
import {
  DEFAULT_VEHICLES,
  FALLBACK_COORDINATE,
  MARKER_COLOR_OPTIONS,
  MAX_PARKING_HISTORY_ITEMS,
  SHEET_HEIGHTS,
  STORAGE_KEYS,
  TIMER_REMINDER_MINUTES
} from "./src/constants/appConstants";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { PhotoModal } from "./src/screens/PhotoModal";
import { TimerScreen } from "./src/screens/TimerScreen";
import { VehiclesScreen } from "./src/screens/VehiclesScreen";
import { styles } from "./src/styles/appStyles";
import type { Coordinate, CustomMapMarker, ParkingHistoryItem, ParkingSpot, PhotoSource, Screen, SheetMode, Vehicle, VehicleType } from "./src/types/parking";
import { reverseGeocode } from "./src/utils/location";
import { parseMinutes } from "./src/utils/time";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState(DEFAULT_VEHICLES[0].id);
  const [parkingSpot, setParkingSpot] = useState<ParkingSpot | null>(null);
  const [parkingHistory, setParkingHistory] = useState<ParkingHistoryItem[]>([]);
  const [customMarkers, setCustomMarkers] = useState<CustomMapMarker[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string | null>(null);
  const [parkingDescription, setParkingDescription] = useState("");
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>("Auto");
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [timerEnd, setTimerEnd] = useState<string | null>(null);
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const [timerSpotId, setTimerSpotId] = useState<string | null>(null);
  const [customTimerMinutes, setCustomTimerMinutes] = useState("90");
  const [now, setNow] = useState(Date.now());
  const [isSavingSpot, setIsSavingSpot] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isPhotoVisible, setIsPhotoVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("mid");
  const sheetHeight = useRef(new Animated.Value(SHEET_HEIGHTS.mid)).current;
  const sheetDragStartHeight = useRef(SHEET_HEIGHTS.mid);
  const sheetCurrentHeight = useRef(SHEET_HEIGHTS.mid);
  const hasShownNotificationAlertRef = useRef(false);

  useEffect(() => {
    async function loadState() {
      const [storedVehicles, storedParkingSpot, storedParkingHistory, storedCustomMarkers, storedTimerEnd, storedTimerStartedAt, storedTimerSpotId] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.vehicles),
          AsyncStorage.getItem(STORAGE_KEYS.parkingSpot),
          AsyncStorage.getItem(STORAGE_KEYS.parkingHistory),
          AsyncStorage.getItem(STORAGE_KEYS.customMarkers),
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

      if (storedParkingHistory) {
        setParkingHistory(JSON.parse(storedParkingHistory) as ParkingHistoryItem[]);
      }

      if (storedCustomMarkers) {
        setCustomMarkers(JSON.parse(storedCustomMarkers) as CustomMapMarker[]);
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

      setIsHydrated(true);
    }

    loadState().catch(() => {
      Alert.alert("Speicherfehler", "Die lokalen Daten konnten nicht gelesen werden.");
      setIsHydrated(true);
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
    AsyncStorage.setItem(STORAGE_KEYS.parkingHistory, JSON.stringify(parkingHistory)).catch(() => undefined);
  }, [parkingHistory]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.customMarkers, JSON.stringify(customMarkers)).catch(() => undefined);
  }, [customMarkers]);

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
    }).start(() => {
      sheetCurrentHeight.current = SHEET_HEIGHTS[sheetMode];
    });
  }, [sheetHeight, sheetMode]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0],
    [selectedVehicleId, vehicles]
  );
  const parkedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === parkingSpot?.vehicleId),
    [parkingSpot?.vehicleId, vehicles]
  );

  const timerSpotMatchesActiveSpot = Boolean(parkingSpot && timerSpotId === parkingSpot.id);
  const remainingMs = timerEnd ? new Date(timerEnd).getTime() - now : 0;
  const timerIsActive = Boolean(timerEnd && remainingMs > 0);
  const activeTimerMinutes = useMemo(() => {
    if (!timerStartedAt || !timerEnd) {
      return null;
    }

    const startedAtMs = new Date(timerStartedAt).getTime();
    const endsAtMs = new Date(timerEnd).getTime();
    const totalMinutes = Math.round((endsAtMs - startedAtMs) / 60000);

    return Number.isFinite(totalMinutes) && totalMinutes > 0 ? totalMinutes : null;
  }, [timerEnd, timerStartedAt]);
  const activeMapCoordinate = parkingSpot ?? currentLocation ?? FALLBACK_COORDINATE;
  const mapRegion = useMemo<Region>(
    () => ({
      latitude: activeMapCoordinate.latitude,
      longitude: activeMapCoordinate.longitude,
      latitudeDelta: parkingSpot ? 0.006 : 0.012,
      longitudeDelta: parkingSpot ? 0.006 : 0.012
    }),
    [activeMapCoordinate.latitude, activeMapCoordinate.longitude, parkingSpot]
  );
  const currentAddressLabel =
    parkingSpot?.address || currentLocationAddress || (currentLocation ? "Aktueller Standort" : "Standort wird gesucht");
  const bottomSheetAnimatedStyle = { height: sheetHeight };
  function clampSheetHeight(height: number) {
    return Math.min(SHEET_HEIGHTS.full, Math.max(SHEET_HEIGHTS.compact, height));
  }

  function nearestSheetMode(height: number): SheetMode {
    return (Object.keys(SHEET_HEIGHTS) as SheetMode[]).reduce((nearestMode, mode) => {
      const nearestDistance = Math.abs(SHEET_HEIGHTS[nearestMode] - height);
      const modeDistance = Math.abs(SHEET_HEIGHTS[mode] - height);
      return modeDistance < nearestDistance ? mode : nearestMode;
    }, "mid");
  }

  function snapSheetToMode(mode: SheetMode) {
    Animated.spring(sheetHeight, {
      toValue: SHEET_HEIGHTS[mode],
      damping: 24,
      mass: 0.9,
      stiffness: 190,
      useNativeDriver: false
    }).start(() => {
      sheetCurrentHeight.current = SHEET_HEIGHTS[mode];
    });
    setSheetMode(mode);
  }

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2,
        onPanResponderGrant: () => {
          sheetHeight.stopAnimation((height) => {
            sheetDragStartHeight.current = height;
            sheetCurrentHeight.current = height;
          });
        },
        onPanResponderMove: (_event, gesture) => {
          const nextHeight = clampSheetHeight(sheetDragStartHeight.current - gesture.dy);
          sheetCurrentHeight.current = nextHeight;
          sheetHeight.setValue(nextHeight);
        },
        onPanResponderRelease: (_event, gesture) => {
          const projectedHeight = clampSheetHeight(sheetCurrentHeight.current - gesture.vy * 120);

          if (gesture.vy < -0.85) {
            snapSheetToMode(sheetMode === "compact" ? "mid" : "full");
            return;
          }

          if (gesture.vy > 0.85) {
            snapSheetToMode(sheetMode === "full" ? "mid" : "compact");
            return;
          }

          snapSheetToMode(nearestSheetMode(projectedHeight));
        },
        onPanResponderTerminate: () => {
          snapSheetToMode(nearestSheetMode(sheetCurrentHeight.current));
        }
      }),
    [sheetHeight, sheetMode]
  );

  useEffect(() => {
    async function syncTimerNotifications() {
      if (!isHydrated) {
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!timerEnd || !parkingSpot || timerSpotId !== parkingSpot.id) {
        return;
      }

      const endDate = new Date(timerEnd);
      const endTimestamp = endDate.getTime();

      if (Number.isNaN(endTimestamp) || endTimestamp <= Date.now()) {
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("parking-timer", {
          name: "Parking timer",
          importance: Notifications.AndroidImportance.HIGH
        });
      }

      const permissionStatus = await Notifications.getPermissionsAsync();
      let finalStatus = permissionStatus.status;

      if (finalStatus !== "granted") {
        const requestedPermission = await Notifications.requestPermissionsAsync();
        finalStatus = requestedPermission.status;
      }

      if (finalStatus !== "granted") {
        if (!hasShownNotificationAlertRef.current) {
          hasShownNotificationAlertRef.current = true;
          Alert.alert(
            "Mitteilungen deaktiviert",
            "Aktiviere Mitteilungen für CarPin, damit du 1 Stunde, 30 Minuten, 10 Minuten, 5 Minuten und beim Ablauf erinnert wirst."
          );
        }
        return;
      }

      hasShownNotificationAlertRef.current = false;

      const vehicleLabel = parkedVehicle?.name ?? "Dein Fahrzeug";
      const locationLabel = parkingSpot.address || parkingSpot.description || "deinem Parkplatz";

      for (const reminderMinute of TIMER_REMINDER_MINUTES) {
        const triggerDate = new Date(endTimestamp - reminderMinute * 60 * 1000);
        if (triggerDate.getTime() <= Date.now()) {
          continue;
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Parktimer endet bald",
            body: `${vehicleLabel} steht noch ${reminderMinute} Minuten bei ${locationLabel}.`,
            sound: true
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            ...(Platform.OS === "android" ? { channelId: "parking-timer" } : {})
          }
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Parkzeit abgelaufen",
          body: `${vehicleLabel} steht noch bei ${locationLabel}.`,
          sound: true
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: endDate,
          ...(Platform.OS === "android" ? { channelId: "parking-timer" } : {})
        }
      });
    }

    syncTimerNotifications().catch(() => {
      if (!hasShownNotificationAlertRef.current) {
        hasShownNotificationAlertRef.current = true;
        Alert.alert("Reminder-Fehler", "Die Timer-Erinnerungen konnten nicht eingerichtet werden.");
      }
    });
  }, [isHydrated, parkedVehicle?.name, parkingSpot, timerEnd, timerSpotId]);

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

  async function refreshCurrentLocation(silent = false) {
    return getDeviceLocation(!silent);
  }

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

  async function pickPhoto(source: PhotoSource) {
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
      if (!parkingSpot) {
        setPendingPhotoUri(result.assets[0].uri);
        return;
      }

      const updatedParkingSpot = { ...parkingSpot, photoUri: result.assets[0].uri };
      setParkingSpot(updatedParkingSpot);
      updateSpotInHistory(updatedParkingSpot);
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

  function openRouteToSpot(spot: ParkingHistoryItem) {
    const url = `http://maps.apple.com/?daddr=${spot.latitude},${spot.longitude}&dirflg=w`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Route nicht möglich", "Apple Maps konnte nicht geöffnet werden.");
    });
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

  async function shareParkingSpot() {
    if (!parkingSpot) {
      return;
    }

    const mapsUrl = `http://maps.apple.com/?daddr=${parkingSpot.latitude},${parkingSpot.longitude}&dirflg=w`;
    const messageParts = [
      `${selectedVehicle?.name ?? "Fahrzeug"} Parkplatz`,
      parkingSpot.address || "Gespeicherter Parkplatz"
    ];

    if (parkingSpot.description) {
      messageParts.push(parkingSpot.description);
    }

    messageParts.push(`Apple Maps: ${mapsUrl}`);

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

  function startTimerUntil(endDate: Date) {
    if (!parkingSpot) {
      Alert.alert("Kein Parkplatz", "Speichere zuerst einen Parkplatz, damit der Timer zugeteilt werden kann.");
      setScreen("dashboard");
      return;
    }

    if (endDate.getTime() <= Date.now()) {
      Alert.alert("Ungültige Zeit", "Wähle einen Zeitpunkt in der Zukunft.");
      return;
    }

    const start = new Date().toISOString();
    setTimerStartedAt(start);
    setTimerEnd(endDate.toISOString());
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
    setParkingDescription("");
    setPendingPhotoUri(null);
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

  function resetVehicleForm() {
    setEditingVehicleId(null);
    setNewVehicleName("");
    setNewVehicleType("Auto");
  }

  function startEditingVehicle(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.id);
    setNewVehicleName(vehicle.name);
    setNewVehicleType(vehicle.type);
  }

  function submitVehicleForm() {
    const trimmedName = newVehicleName.trim();
    if (!trimmedName) {
      Alert.alert("Name fehlt", "Gib einen Fahrzeugnamen ein.");
      return;
    }

    if (editingVehicleId) {
      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === editingVehicleId ? { ...vehicle, name: trimmedName, type: newVehicleType } : vehicle
        )
      );
      resetVehicleForm();
      return;
    }

    const vehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      name: trimmedName,
      type: newVehicleType
    };

    setVehicles((currentVehicles) => [...currentVehicles, vehicle]);
    setSelectedVehicleId(vehicle.id);
    resetVehicleForm();
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

          if (editingVehicleId === vehicleId) {
            resetVehicleForm();
          }

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
        <Header title={screen === "timer" ? "Parktimer" : screen === "vehicles" ? "Fahrzeuge" : screen === "history" ? "History" : "CarPin"} />

        <View style={styles.tabs}>
          <TabButton label="Parken" isActive={screen === "dashboard"} onPress={() => setScreen("dashboard")} />
          <TabButton label="Timer" isActive={screen === "timer"} onPress={() => setScreen("timer")} />
          <TabButton label="Fahrzeuge" isActive={screen === "vehicles"} onPress={() => setScreen("vehicles")} />
          <TabButton label="History" isActive={screen === "history"} onPress={() => setScreen("history")} />
        </View>

        {screen === "dashboard" && (
          <DashboardScreen
            bottomSheetAnimatedStyle={bottomSheetAnimatedStyle}
            customMarkers={customMarkers}
            currentAddressLabel={currentAddressLabel}
            currentLocation={currentLocation}
            isLocating={isLocating}
            isSavingSpot={isSavingSpot}
            onAddCustomMarker={addCustomMarker}
            mapRegion={mapRegion}
            onChangeParkingDescription={setParkingDescription}
            onClearParkingSpot={clearParkingSpot}
            onOpenRoute={openRoute}
            onOpenTimer={() => setScreen("timer")}
            onPickPhoto={pickPhoto}
            onRefreshCurrentLocation={() => refreshCurrentLocation(false)}
            onSaveParkingSpot={saveParkingSpot}
            onSelectVehicle={setSelectedVehicleId}
            onShareParking={shareParkingSpot}
            onShowPhoto={() => setIsPhotoVisible(true)}
            onToggleSheetMode={toggleSheetMode}
            parkingDescription={parkingDescription}
            parkingSpot={parkingSpot}
            pendingPhotoUri={pendingPhotoUri}
            remainingMs={remainingMs}
            selectedVehicle={selectedVehicle}
            selectedVehicleId={selectedVehicleId}
            sheetMode={sheetMode}
            sheetPanHandlers={sheetPanResponder.panHandlers}
            timerIsActive={timerIsActive}
            timerSpotMatchesActiveSpot={timerSpotMatchesActiveSpot}
            vehicles={vehicles}
          />
        )}

        {screen === "timer" && (
          <TimerScreen
            activeTimerMinutes={activeTimerMinutes}
            customTimerMinutes={customTimerMinutes}
            onChangeCustomTimerMinutes={setCustomTimerMinutes}
            onStartTimer={startTimer}
            onStartTimerUntil={startTimerUntil}
            parkingSpot={parkingSpot}
            remainingMs={remainingMs}
            timerEnd={timerEnd}
            timerIsActive={timerIsActive}
            timerSpotMatchesActiveSpot={timerSpotMatchesActiveSpot}
            timerStartedAt={timerStartedAt}
          />
        )}

        {screen === "vehicles" && (
          <VehiclesScreen
            editingVehicleId={editingVehicleId}
            newVehicleName={newVehicleName}
            newVehicleType={newVehicleType}
            onChangeNewVehicleName={setNewVehicleName}
            onChangeNewVehicleType={setNewVehicleType}
            onDeleteVehicle={deleteVehicle}
            onResetVehicleForm={resetVehicleForm}
            onSelectVehicle={setSelectedVehicleId}
            onStartEditingVehicle={startEditingVehicle}
            onSubmitVehicleForm={submitVehicleForm}
            selectedVehicleId={selectedVehicleId}
            vehicles={vehicles}
          />
        )}

        {screen === "history" && (
          <HistoryScreen
            history={parkingHistory}
            onClearHistory={clearParkingHistory}
            onDeleteHistoryItem={deleteParkingHistoryItem}
            onOpenRoute={openRouteToSpot}
            vehicles={vehicles}
          />
        )}
      </View>

      <PhotoModal
        isVisible={isPhotoVisible}
        onClose={() => setIsPhotoVisible(false)}
        parkingSpot={parkingSpot}
        photoUri={pendingPhotoUri}
      />
    </SafeAreaView>
  );
}
