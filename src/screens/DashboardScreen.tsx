import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Animated,
  GestureResponderHandlers,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import type { Region } from "react-native-maps";

import { CarPinMap } from "../components/CarPinMap";
import { FullInfoTile } from "../components/FullInfoTile";
import { SHEET_HEIGHTS } from "../constants/appConstants";
import { styles } from "../styles/appStyles";
import type { Coordinate, ParkingSpot, PhotoSource, SheetMode, Vehicle } from "../types/parking";
import { formatCountdown, formatTime } from "../utils/time";

type DashboardScreenProps = {
  bottomSheetAnimatedStyle: { height: Animated.Value };
  currentAddressLabel: string;
  currentLocation: Coordinate | null;
  isLocating: boolean;
  isSavingSpot: boolean;
  isWideLayout?: boolean;
  mapRegion: Region;
  onChangeParkingDescription: (value: string) => void;
  onClearParkingSpot: () => void;
  onOpenRoute: () => void;
  onOpenTimer: () => void;
  onPickPhoto: (source: PhotoSource) => void;
  onRefreshCurrentLocation: () => Promise<Coordinate | null>;
  onSaveParkingSpot: () => void;
  onSelectVehicle: (vehicleId: string) => void;
  onShareParking: () => void;
  onShowPhoto: () => void;
  onToggleSheetMode: () => void;
  onUpdateParkingSpotDescription: (value: string) => void;
  parkingDescription: string;
  parkingSpot: ParkingSpot | null;
  pendingPhotoUri: string | null;
  remainingMs: number;
  selectedVehicle: Vehicle | undefined;
  selectedVehicleId: string;
  sheetMode: SheetMode;
  sheetPanHandlers: GestureResponderHandlers;
  timerIsActive: boolean;
  timerSpotMatchesActiveSpot: boolean;
  vehicles: Vehicle[];
};

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

function getInfoTileIcon(tile: "location" | "timer" | "photo") {
  if (tile === "location") {
    return <MaterialCommunityIcons color="#20c8f4" name="crosshairs-gps" size={18} />;
  }

  if (tile === "timer") {
    return <MaterialCommunityIcons color="#20c8f4" name="timer-outline" size={18} />;
  }

  return <MaterialCommunityIcons color="#20c8f4" name="image-outline" size={18} />;
}

function VehicleIconSelector({
  onSelectVehicle,
  selectedVehicleId,
  vehicles
}: {
  onSelectVehicle: (vehicleId: string) => void;
  selectedVehicleId: string;
  vehicles: Vehicle[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.vehicleSelectorScroll}
      contentContainerStyle={styles.vehicleStrip}
    >
      {vehicles.map((vehicle) => {
        const { iconName, IconComponent } = getVehicleIcon(vehicle);
        const isActive = selectedVehicleId === vehicle.id;

        return (
          <TouchableOpacity
            key={vehicle.id}
            style={[styles.vehicleIconPill, isActive && styles.vehiclePillActive]}
            onPress={() => onSelectVehicle(vehicle.id)}
          >
            <Text style={[styles.vehiclePillText, isActive && styles.vehiclePillTextActive]}>{vehicle.name}</Text>
            <IconComponent
              color={
                isActive
                  ? StyleSheet.flatten(styles.vehiclePillTextActive)?.color || "#071018"
                  : StyleSheet.flatten(styles.vehiclePillText)?.color || "#b7b5c8"
              }
              name={iconName}
              size={26}
              style={styles.vehicleIcon}
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function DashboardScreen({
  bottomSheetAnimatedStyle,
  currentAddressLabel,
  currentLocation,
  isLocating,
  isSavingSpot,
  isWideLayout = false,
  mapRegion,
  onChangeParkingDescription,
  onClearParkingSpot,
  onOpenRoute,
  onOpenTimer,
  onPickPhoto,
  onRefreshCurrentLocation,
  onSaveParkingSpot,
  onSelectVehicle,
  onShareParking,
  onShowPhoto,
  onToggleSheetMode,
  onUpdateParkingSpotDescription,
  parkingDescription,
  parkingSpot,
  pendingPhotoUri,
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
  const VehicleInfoIcon = vehicleIcon.IconComponent;
  const fullSheetScrollRef = useRef<ScrollView | null>(null);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(parkingDescription);
  const sheetHeight = bottomSheetAnimatedStyle.height;
  const compactContentAnimatedStyle = {
    opacity: sheetHeight.interpolate({
      inputRange: [SHEET_HEIGHTS.compact, SHEET_HEIGHTS.compact + 70, SHEET_HEIGHTS.mid],
      outputRange: [1, 0, 0],
      extrapolate: "clamp"
    }),
    transform: [
      {
        translateY: sheetHeight.interpolate({
          inputRange: [SHEET_HEIGHTS.compact, SHEET_HEIGHTS.mid],
          outputRange: [0, -18],
          extrapolate: "clamp"
        })
      },
      {
        scale: sheetHeight.interpolate({
          inputRange: [SHEET_HEIGHTS.compact, SHEET_HEIGHTS.mid],
          outputRange: [1, 0.97],
          extrapolate: "clamp"
        })
      }
    ]
  };
  const midContentAnimatedStyle = {
    opacity: sheetHeight.interpolate({
      inputRange: [SHEET_HEIGHTS.compact + 45, SHEET_HEIGHTS.mid - 24, SHEET_HEIGHTS.mid + 110, SHEET_HEIGHTS.full],
      outputRange: [0, 1, 0, 0],
      extrapolate: "clamp"
    }),
    transform: [
      {
        translateY: sheetHeight.interpolate({
          inputRange: [SHEET_HEIGHTS.compact, SHEET_HEIGHTS.mid, SHEET_HEIGHTS.full],
          outputRange: [22, 0, -26],
          extrapolate: "clamp"
        })
      },
      {
        scale: sheetHeight.interpolate({
          inputRange: [SHEET_HEIGHTS.compact, SHEET_HEIGHTS.mid, SHEET_HEIGHTS.full],
          outputRange: [0.97, 1, 0.96],
          extrapolate: "clamp"
        })
      }
    ]
  };
  const fullContentAnimatedStyle = {
    opacity: sheetHeight.interpolate({
      inputRange: [SHEET_HEIGHTS.mid + 45, SHEET_HEIGHTS.full - 120],
      outputRange: [0, 1],
      extrapolate: "clamp"
    }),
    transform: [
      {
        translateY: sheetHeight.interpolate({
          inputRange: [SHEET_HEIGHTS.mid, SHEET_HEIGHTS.full],
          outputRange: [28, 0],
          extrapolate: "clamp"
        })
      },
      {
        scale: sheetHeight.interpolate({
          inputRange: [SHEET_HEIGHTS.mid, SHEET_HEIGHTS.full],
          outputRange: [0.98, 1],
          extrapolate: "clamp"
        })
      }
    ]
  };

  function renderCompactContent() {
    return (
      <TouchableOpacity
        style={[parkingSpot ? styles.endParkingButton : styles.primaryButton, styles.compactSheetButton]}
        onPress={parkingSpot ? onClearParkingSpot : onSaveParkingSpot}
        disabled={isSavingSpot}
      >
        <Text style={parkingSpot ? styles.endParkingButtonText : styles.primaryButtonText}>
          {parkingSpot ? "Parking beenden" : isSavingSpot ? "Speichere..." : "Parkplatz speichern"}
        </Text>
      </TouchableOpacity>
    );
  }

  function openDescriptionModal() {
    setDescriptionDraft(parkingSpot?.description ?? parkingDescription);
    setIsDescriptionModalVisible(true);
  }

  function submitDescription() {
    if (parkingSpot) {
      onUpdateParkingSpotDescription(descriptionDraft);
    } else {
      onChangeParkingDescription(descriptionDraft.trim());
    }
    setIsDescriptionModalVisible(false);
  }

  function renderMidContent() {
    if (parkingSpot) {
      return (
        <>
          <View style={styles.savedCard}>
            <Text style={styles.savedEyebrow}>Parkplatz gespeichert</Text>
            <Text style={styles.savedTitle}>{parkingSpot.address || "Gespeicherter Parkplatz"}</Text>
            <Text style={styles.savedMeta}>
              {selectedVehicle?.name ?? "Fahrzeug"} · Heute, {formatTime(parkingSpot.savedAt).split(",").pop()?.trim()}
            </Text>
            {parkingSpot.description ? <Text style={styles.parkingDescriptionText}>{parkingSpot.description}</Text> : null}
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
              <Text style={styles.primaryButtonText}>Zurück zum Auto</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.timerShortcut} onPress={onShareParking}>
            <Text style={styles.timerShortcutText}>Parking teilen</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endParkingButton} onPress={onClearParkingSpot}>
            <Text style={styles.endParkingButtonText}>Parking beenden</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
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

        <VehicleIconSelector onSelectVehicle={onSelectVehicle} selectedVehicleId={selectedVehicleId} vehicles={vehicles} />

        <TouchableOpacity style={[styles.primaryButton, styles.midSaveButton]} onPress={onSaveParkingSpot} disabled={isSavingSpot}>
          <Text style={styles.primaryButtonText}>{isSavingSpot ? "Speichere..." : "Parkplatz speichern"}</Text>
        </TouchableOpacity>
      </>
    );
  }

  function renderFullContent() {
    return (
      <>
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
            {parkingSpot?.description ? <Text style={styles.parkingDescriptionText}>{parkingSpot.description}</Text> : null}
          </View>
        </View>

        <View style={styles.fullIconGrid}>
          <FullInfoTile iconElement={getInfoTileIcon("location")} label="Standort" value={currentAddressLabel} />
          <FullInfoTile
            iconElement={<VehicleInfoIcon color="#20c8f4" name={vehicleIcon.iconName} size={18} />}
            label="Fahrzeug"
            value={selectedVehicle?.name ?? "Kein Fahrzeug"}
          />
          <FullInfoTile
            iconElement={getInfoTileIcon("timer")}
            label="Timer"
            value={parkingSpot && timerSpotMatchesActiveSpot && timerIsActive ? formatCountdown(remainingMs) : "nicht gesetzt"}
          />
          <FullInfoTile
            iconElement={getInfoTileIcon("photo")}
            label="Foto"
            value={parkingSpot?.photoUri || pendingPhotoUri ? "gespeichert" : "noch offen"}
          />
        </View>

        <View style={styles.fullActionPanel}>
          {parkingSpot ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={onOpenRoute}>
                <Text style={styles.primaryButtonText}>Zurück zum Auto</Text>
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
              <TouchableOpacity style={styles.descriptionEditButton} onPress={openDescriptionModal}>
                <Text style={styles.descriptionEditButtonText}>Beschreibung bearbeiten</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timerShortcut} onPress={onOpenTimer}>
                <Text style={styles.timerShortcutText}>Parktimer für diesen Parkplatz setzen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timerShortcut} onPress={onShareParking}>
                <Text style={styles.timerShortcutText}>Parking teilen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.endParkingButton} onPress={onClearParkingSpot}>
                <Text style={styles.endParkingButtonText}>Parking beenden</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <VehicleIconSelector onSelectVehicle={onSelectVehicle} selectedVehicleId={selectedVehicleId} vehicles={vehicles} />
              <TouchableOpacity style={styles.descriptionOpenButton} onPress={openDescriptionModal}>
                <View style={styles.customTimerOpenTextWrap}>
                  <Text style={styles.customTimerOpenLabel}>
                    {parkingDescription ? "Beschreibung bearbeiten" : "Beschreibung hinzufügen"}
                  </Text>
                  <Text style={styles.customTimerOpenMeta}>
                    {parkingDescription || "Ort, Etage oder Parkplatznummer ergänzen"}
                  </Text>
                </View>
                <Text style={styles.customTimerOpenIcon}>+</Text>
              </TouchableOpacity>
              <Text style={styles.sectionLabel}>Foto</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.darkButton} onPress={() => onPickPhoto("camera")}>
                  <Text style={styles.darkButtonText}>Foto aufnehmen</Text>
                </TouchableOpacity>
                {pendingPhotoUri ? (
                  <TouchableOpacity style={styles.darkButton} onPress={onShowPhoto}>
                    <Text style={styles.darkButtonText}>Foto anzeigen</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.darkButton} onPress={() => onPickPhoto("library")}>
                    <Text style={styles.darkButtonText}>Galerie</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={onSaveParkingSpot} disabled={isSavingSpot}>
                <Text style={styles.primaryButtonText}>{isSavingSpot ? "Speichere..." : "Parkplatz speichern"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </>
    );
  }

  if (isWideLayout) {
    return (
      <View style={styles.wideMapScreen}>
        <CarPinMap
          currentLocation={currentLocation}
          isLocating={isLocating}
          onRefreshLocation={onRefreshCurrentLocation}
          parkingSpot={parkingSpot}
          region={mapRegion}
        />

        <TouchableOpacity
          style={styles.wideMapPrimaryButton}
          onPress={parkingSpot ? onOpenRoute : onSaveParkingSpot}
          disabled={isSavingSpot}
        >
          <MaterialCommunityIcons color="#071018" name={parkingSpot ? "navigation-variant" : "map-marker-plus"} size={22} />
          <Text style={styles.wideMapPrimaryButtonText}>
            {parkingSpot ? "Route starten" : isSavingSpot ? "Speichere..." : "Parkplatz speichern"}
          </Text>
        </TouchableOpacity>

        <View style={styles.wideMapActionTray}>
          {parkingSpot ? (
            <>
              <TouchableOpacity style={styles.wideMapActionButton} onPress={openDescriptionModal}>
                <Text style={styles.wideMapActionButtonText}>Beschreibung</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.wideMapActionButton}
                onPress={parkingSpot.photoUri ? onShowPhoto : () => onPickPhoto("camera")}
              >
                <Text style={styles.wideMapActionButtonText}>{parkingSpot.photoUri ? "Foto zeigen" : "Foto"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.wideMapActionButton} onPress={onOpenTimer}>
                <Text style={styles.wideMapActionButtonText}>Timer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.wideMapActionButton} onPress={onShareParking}>
                <Text style={styles.wideMapActionButtonText}>Teilen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.wideMapActionButton, styles.wideMapDangerButton]} onPress={onClearParkingSpot}>
                <Text style={[styles.wideMapActionButtonText, styles.wideMapDangerButtonText]}>Beenden</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.wideMapActionButton} onPress={openDescriptionModal}>
                <Text style={styles.wideMapActionButtonText}>Beschreibung</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.wideMapActionButton} onPress={() => onPickPhoto("camera")}>
                <Text style={styles.wideMapActionButtonText}>Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.wideMapActionButton} onPress={() => onPickPhoto("library")}>
                <Text style={styles.wideMapActionButtonText}>Galerie</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Modal
          animationType="slide"
          onRequestClose={() => setIsDescriptionModalVisible(false)}
          transparent
          visible={isDescriptionModalVisible}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.customTimerModalBackdrop}
          >
            <View style={styles.customTimerModal}>
              <View style={styles.customTimerModalHeader}>
                <View>
                  <Text style={styles.customTimerModalTitle}>
                    {parkingSpot ? "Beschreibung bearbeiten" : "Beschreibung hinzufügen"}
                  </Text>
                  <Text style={styles.customTimerModalMeta}>Speichere eine kurze Notiz zu deinem Parkplatz.</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsDescriptionModalVisible(false)}>
                  <Text style={styles.modalCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.customTimerFieldGroup}>
                <Text style={styles.customTimerFieldLabel}>Beschreibung</Text>
                <TextInput
                  multiline
                  numberOfLines={4}
                  onChangeText={setDescriptionDraft}
                  placeholder="z.B. Parkhaus, 2. Stock, Platz 234"
                  placeholderTextColor="#777589"
                  returnKeyType="done"
                  style={[styles.customTimerModalInput, styles.descriptionModalInput]}
                  textAlignVertical="top"
                  value={descriptionDraft}
                />
              </View>

              <TouchableOpacity style={styles.customTimerSubmitButton} onPress={submitDescription}>
                <Text style={styles.customTimerSubmitButtonText}>OK speichern</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.mapScreen}>
      <CarPinMap
        currentLocation={currentLocation}
        isLocating={isLocating}
        onRefreshLocation={onRefreshCurrentLocation}
        parkingSpot={parkingSpot}
        region={mapRegion}
      />

      <Animated.View style={[styles.bottomSheet, bottomSheetAnimatedStyle]} {...sheetPanHandlers}>
        <View style={styles.sheetHandleArea}>
          <TouchableOpacity style={styles.handleTapTarget} onPress={onToggleSheetMode}>
            <View style={styles.handle} />
            <Text style={styles.sheetHint}>
              {sheetMode === "full" ? "Nach unten ziehen" : sheetMode === "compact" ? "Nach oben ziehen" : "Ziehen für Vollbild"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sheetContentStage}>
          <Animated.View
            pointerEvents={sheetMode === "compact" ? "auto" : "none"}
            style={[styles.sheetContentLayer, compactContentAnimatedStyle]}
          >
            {renderCompactContent()}
          </Animated.View>

          <Animated.View
            pointerEvents={sheetMode === "mid" ? "auto" : "none"}
            style={[styles.sheetContentLayer, midContentAnimatedStyle]}
          >
            {renderMidContent()}
          </Animated.View>

          <Animated.ScrollView
            ref={fullSheetScrollRef}
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            pointerEvents={sheetMode === "full" ? "auto" : "none"}
            showsVerticalScrollIndicator={false}
            style={[styles.sheetContentLayer, fullContentAnimatedStyle]}
            contentContainerStyle={styles.fullSheetContent}
          >
            {renderFullContent()}
          </Animated.ScrollView>
        </View>
      </Animated.View>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsDescriptionModalVisible(false)}
        transparent
        visible={isDescriptionModalVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.customTimerModalBackdrop}
        >
          <View style={styles.customTimerModal}>
            <View style={styles.customTimerModalHeader}>
              <View>
                <Text style={styles.customTimerModalTitle}>
                  {parkingSpot ? "Beschreibung bearbeiten" : "Beschreibung hinzufügen"}
                </Text>
                <Text style={styles.customTimerModalMeta}>Speichere eine kurze Notiz zu deinem Parkplatz.</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsDescriptionModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.customTimerFieldGroup}>
              <Text style={styles.customTimerFieldLabel}>Beschreibung</Text>
              <TextInput
                multiline
                numberOfLines={4}
                onChangeText={setDescriptionDraft}
                placeholder="z.B. Parkhaus, 2. Stock, Platz 234"
                placeholderTextColor="#777589"
                returnKeyType="done"
                style={[styles.customTimerModalInput, styles.descriptionModalInput]}
                textAlignVertical="top"
                value={descriptionDraft}
              />
            </View>

            <TouchableOpacity style={styles.customTimerSubmitButton} onPress={submitDescription}>
              <Text style={styles.customTimerSubmitButtonText}>OK speichern</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
