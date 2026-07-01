import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Animated, GestureResponderHandlers, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Region } from "react-native-maps";

import { CarPinMap } from "../components/CarPinMap";
import { FullInfoTile } from "../components/FullInfoTile";
import { Metric } from "../components/Metric";
import { styles } from "../styles/appStyles";
import type { Coordinate, ParkingSpot, PhotoSource, SheetMode, Vehicle } from "../types/parking";
import { formatCountdown, formatTime } from "../utils/time";

type DashboardScreenProps = {
  bottomSheetAnimatedStyle: { height: Animated.Value };
  coordinateLabel: string;
  currentAddressLabel: string;
  currentLocation: Coordinate | null;
  isLocating: boolean;
  isSavingSpot: boolean;
  mapRegion: Region;
  onChangeParkingDescription: (value: string) => void;
  onClearParkingSpot: () => void;
  onOpenRoute: () => void;
  onOpenTimer: () => void;
  onPickPhoto: (source: PhotoSource) => void;
  onRefreshCurrentLocation: () => void;
  onSaveParkingSpot: () => void;
  onSelectVehicle: (vehicleId: string) => void;
  onShowPhoto: () => void;
  onToggleSheetMode: () => void;
  parkingDescription: string;
  parkingSpot: ParkingSpot | null;
  remainingMs: number;
  selectedVehicle: Vehicle | undefined;
  selectedVehicleId: string;
  sheetMode: SheetMode;
  sheetPanHandlers: GestureResponderHandlers;
  timerIsActive: boolean;
  timerSpotMatchesActiveSpot: boolean;
  vehicles: Vehicle[];
};

function ParkingDescriptionInput({
  parkingDescription,
  onChangeParkingDescription
}: {
  parkingDescription: string;
  onChangeParkingDescription: (value: string) => void;
}) {
  return (
    <>
      <Text style={styles.sectionLabel}>Beschreibung</Text>
      <TextInput
        multiline
        numberOfLines={3}
        onChangeText={onChangeParkingDescription}
        placeholder="z.B. Parkhaus, 2. Stock, Platz 234"
        placeholderTextColor="#777589"
        style={[styles.input, styles.parkingDescriptionInput]}
        value={parkingDescription}
      />
    </>
  );
}

function getVehicleIcon(vehicle: Vehicle | undefined) {
  const checkName = (vehicle?.type || vehicle?.name || "").toLowerCase().trim();

  if (checkName.includes("velo") || checkName.includes("bicycle") || checkName.includes("fahrrad")) {
    return { iconName: "bicycle", IconComponent: FontAwesome5 };
  }

  if (checkName.includes("scooter") || checkName.includes("trottinett") || checkName.includes("roller")) {
    return { iconName: "scooter", IconComponent: MaterialCommunityIcons };
  }

  if (checkName.includes("motorrad") || checkName.includes("moto") || checkName.includes("motorcycle")) {
    return { iconName: "motorcycle", IconComponent: FontAwesome5 };
  }

  return { iconName: "car", IconComponent: FontAwesome5 };
}

export function DashboardScreen({
  bottomSheetAnimatedStyle,
  coordinateLabel,
  currentAddressLabel,
  currentLocation,
  isLocating,
  isSavingSpot,
  mapRegion,
  onChangeParkingDescription,
  onClearParkingSpot,
  onOpenRoute,
  onOpenTimer,
  onPickPhoto,
  onRefreshCurrentLocation,
  onSaveParkingSpot,
  onSelectVehicle,
  onShowPhoto,
  onToggleSheetMode,
  parkingDescription,
  parkingSpot,
  remainingMs,
  selectedVehicle,
  selectedVehicleId,
  sheetMode,
  sheetPanHandlers,
  timerIsActive,
  timerSpotMatchesActiveSpot,
  vehicles
}: DashboardScreenProps) {
  const vehicleIcon = getVehicleIcon(selectedVehicle);

  return (
    <View style={styles.mapScreen}>
      <CarPinMap
        currentLocation={currentLocation}
        isLocating={isLocating}
        onRefreshLocation={onRefreshCurrentLocation}
        parkingSpot={parkingSpot}
        region={mapRegion}
      />

      <Animated.View style={[styles.bottomSheet, bottomSheetAnimatedStyle]}>
        <View style={styles.sheetHandleArea} {...sheetPanHandlers}>
          <TouchableOpacity style={styles.handleTapTarget} onPress={onToggleSheetMode}>
            <View style={styles.handle} />
            <Text style={styles.sheetHint}>
              {sheetMode === "full" ? "Nach unten ziehen" : sheetMode === "compact" ? "Nach oben ziehen" : "Ziehen fuer Vollbild"}
            </Text>
          </TouchableOpacity>
        </View>

        {sheetMode === "compact" ? (
          <TouchableOpacity
            style={parkingSpot ? styles.endParkingButton : styles.primaryButton}
            onPress={parkingSpot ? onClearParkingSpot : onSaveParkingSpot}
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
                    : `${selectedVehicle?.name ?? "Fahrzeug"} · Standort pruefen und Parkplatz speichern`}
                </Text>
                {parkingSpot?.description ? <Text style={styles.parkingDescriptionText}>{parkingSpot.description}</Text> : null}
              </View>
            </View>

            <View style={styles.fullIconGrid}>
              <FullInfoTile icon="L" label="Standort" value={coordinateLabel} />
              <FullInfoTile icon={vehicleIcon.iconName} label="Fahrzeug" value={selectedVehicle?.name ?? "Kein Fahrzeug"} />
              <FullInfoTile
                icon="T"
                label="Timer"
                value={parkingSpot && timerSpotMatchesActiveSpot && timerIsActive ? formatCountdown(remainingMs) : "nicht gesetzt"}
              />
              <FullInfoTile icon="F" label="Foto" value={parkingSpot?.photoUri ? "gespeichert" : "noch offen"} />
            </View>

            <View style={styles.fullActionPanel}>
              {parkingSpot ? (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={onOpenRoute}>
                    <Text style={styles.primaryButtonText}>Zurueck zum Auto</Text>
                  </TouchableOpacity>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.darkButton} onPress={() => onPickPhoto("camera")}>
                      <Text style={styles.darkButtonText}>Foto aufnehmen</Text>
                    </TouchableOpacity>
                    {parkingSpot.photoUri ? (
                      <TouchableOpacity style={styles.darkButton} onPress={onShowPhoto}>
                        <Text style={styles.darkButtonText}>Foto anzeigen</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.darkButton} onPress={() => onPickPhoto("library")}>
                        <Text style={styles.darkButtonText}>Galerie</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity style={styles.timerShortcut} onPress={onOpenTimer}>
                    <Text style={styles.timerShortcutText}>Parktimer fuer diesen Parkplatz setzen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.endParkingButton} onPress={onClearParkingSpot}>
                    <Text style={styles.endParkingButtonText}>Parking beenden</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <ParkingDescriptionInput
                    parkingDescription={parkingDescription}
                    onChangeParkingDescription={onChangeParkingDescription}
                  />
                  <TouchableOpacity style={styles.primaryButton} onPress={onSaveParkingSpot} disabled={isSavingSpot}>
                    <Text style={styles.primaryButtonText}>{isSavingSpot ? "Speichere..." : "Parkplatz speichern"}</Text>
                  </TouchableOpacity>
                </>
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
              {parkingSpot.description ? <Text style={styles.parkingDescriptionText}>{parkingSpot.description}</Text> : null}
            </View>

            <View style={styles.metricsRow}>
              <Metric label="Timer" value={timerSpotMatchesActiveSpot && timerIsActive ? formatCountdown(remainingMs) : "nicht gesetzt"} />
              <Metric label="Foto" value={parkingSpot.photoUri ? "gespeichert" : "offen"} />
              <Metric label="Route" value="Apple Maps" />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.darkButton} onPress={() => onPickPhoto("camera")}>
                <Text style={styles.darkButtonText}>Foto aufnehmen</Text>
              </TouchableOpacity>
              {parkingSpot.photoUri ? (
                <TouchableOpacity style={styles.darkButton} onPress={onShowPhoto}>
                  <Text style={styles.darkButtonText}>Foto anzeigen</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.darkButton} onPress={() => onPickPhoto("library")}>
                  <Text style={styles.darkButtonText}>Galerie</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.primaryButtonSmall} onPress={onOpenRoute}>
                <Text style={styles.primaryButtonText}>Zurueck zum Auto</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.timerShortcut} onPress={onOpenTimer}>
              <Text style={styles.timerShortcutText}>Parktimer fuer diesen Parkplatz setzen</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.endParkingButton} onPress={onClearParkingSpot}>
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
              {vehicles.map((vehicle) => {
                const { iconName, IconComponent } = getVehicleIcon(vehicle);
                const isActive = selectedVehicleId === vehicle.id;
                const targetRadius = StyleSheet.flatten(styles.lastSavedCard)?.borderRadius || 12;

                return (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehiclePill,
                      isActive && styles.vehiclePillActive,
                      {
                        alignItems: "center",
                        borderRadius: targetRadius,
                        flexDirection: "column",
                        marginHorizontal: 5,
                        minWidth: 100,
                        paddingVertical: 12
                      }
                    ]}
                    onPress={() => onSelectVehicle(vehicle.id)}
                  >
                    <Text style={[styles.vehiclePillText, isActive && styles.vehiclePillTextActive]}>{vehicle.name}</Text>
                    <IconComponent
                      color={
                        isActive
                          ? StyleSheet.flatten(styles.vehiclePillTextActive)?.color || "#00E5FF"
                          : StyleSheet.flatten(styles.vehiclePillText)?.color || "#71717A"
                      }
                      name={iconName}
                      size={26}
                      style={{ marginTop: 8 }}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ParkingDescriptionInput
              parkingDescription={parkingDescription}
              onChangeParkingDescription={onChangeParkingDescription}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={onSaveParkingSpot} disabled={isSavingSpot}>
              <Text style={styles.primaryButtonText}>{isSavingSpot ? "Speichere..." : "Parkplatz speichern"}</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
}
