import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Animated, Linking, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import type { MapPressEvent } from "react-native-maps";

import { MAP_DARK_STYLE, MARKER_COLOR_OPTIONS } from "../constants/appConstants";
import { styles } from "../styles/appStyles";
import type { Coordinate, CustomMapMarker, MarkerDisplayMode, ParkingSpot } from "../types/parking";

type CarPinMapProps = {
  currentLocation: Coordinate | null;
  customMarkers: CustomMapMarker[];
  isLocating: boolean;
  onAddCustomMarker: (coordinate: Coordinate, name: string, color: string) => void;
  onRefreshLocation: () => Promise<Coordinate | null>;
  parkingSpot: ParkingSpot | null;
  region: Region;
};

const HEADING_UPDATE_THRESHOLD = 6;

function normalizeHeading(heading: number) {
  if (!Number.isFinite(heading)) {
    return 0;
  }

  return ((heading % 360) + 360) % 360;
}

function headingDelta(a: number, b: number) {
  const difference = Math.abs(a - b) % 360;
  return difference > 180 ? 360 - difference : difference;
}

function isCoordinateNearTarget(pressedCoordinate: Coordinate, targetCoordinate: Coordinate, latitudeDelta: number) {
  const latitudeThreshold = Math.max(latitudeDelta * 0.08, 0.00035);
  const longitudeThreshold = Math.max(latitudeDelta * 0.08, 0.00035);

  return (
    Math.abs(pressedCoordinate.latitude - targetCoordinate.latitude) <= latitudeThreshold &&
    Math.abs(pressedCoordinate.longitude - targetCoordinate.longitude) <= longitudeThreshold
  );
}

function getNextMarkerMode(mode: MarkerDisplayMode): MarkerDisplayMode {
  if (mode === "labels") {
    return "icons";
  }

  if (mode === "icons") {
    return "hidden";
  }

  return "labels";
}

export function CarPinMap({
  currentLocation,
  customMarkers,
  isLocating,
  onAddCustomMarker,
  onRefreshLocation,
  parkingSpot,
  region
}: CarPinMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const actionMenuAnimation = useRef(new Animated.Value(0)).current;
  const lastAppliedHeadingRef = useRef(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [isHeadingFollowEnabled, setIsHeadingFollowEnabled] = useState(true);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [markerDisplayMode, setMarkerDisplayMode] = useState<MarkerDisplayMode>("labels");
  const [pendingMarkerCoordinate, setPendingMarkerCoordinate] = useState<Coordinate | null>(null);
  const [isMarkerModalVisible, setIsMarkerModalVisible] = useState(false);
  const [markerNameDraft, setMarkerNameDraft] = useState("");
  const [markerColorDraft, setMarkerColorDraft] = useState<string>(MARKER_COLOR_OPTIONS[0]);
  const [visibleLatitudeDelta, setVisibleLatitudeDelta] = useState(region.latitudeDelta);
  const parkingCoordinate = parkingSpot ? { latitude: parkingSpot.latitude, longitude: parkingSpot.longitude } : null;
  const routeCoordinates = currentLocation && parkingCoordinate ? [currentLocation, parkingCoordinate] : [];

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 350);
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  useEffect(() => {
    if (!isHeadingFollowEnabled) {
      mapRef.current?.animateCamera({ heading: 0 }, { duration: 250 });
      lastAppliedHeadingRef.current = 0;
      return;
    }

    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;

    Location.watchHeadingAsync((headingUpdate) => {
      if (!isMounted) {
        return;
      }

      const nextHeading = normalizeHeading(headingUpdate.trueHeading >= 0 ? headingUpdate.trueHeading : headingUpdate.magHeading);
      setDeviceHeading(nextHeading);

      if (headingDelta(lastAppliedHeadingRef.current, nextHeading) < HEADING_UPDATE_THRESHOLD) {
        return;
      }

      lastAppliedHeadingRef.current = nextHeading;
      mapRef.current?.animateCamera({ heading: nextHeading }, { duration: 220 });
    })
      .then((watcher) => {
        subscription = watcher;
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [isHeadingFollowEnabled]);

  useEffect(() => {
    Animated.spring(actionMenuAnimation, {
      toValue: isActionMenuOpen ? 1 : 0,
      damping: 18,
      mass: 0.8,
      stiffness: 210,
      useNativeDriver: true
    }).start();
  }, [actionMenuAnimation, isActionMenuOpen]);

  const handleOpenSwissParkingSearch = () => {
    const query = encodeURIComponent("Parking");
    const regionName = encodeURIComponent("Switzerland");

    const url = Platform.select({
      ios: `maps://?q=${query}&near=${regionName}`,
      android: `geo:0,0?q=${query}+${regionName}`
    });

    if (url) {
      Linking.openURL(url).catch((err) => console.error("Fehler beim Öffnen der Karte:", err));
    }
  };

  function handleMapPress(event: MapPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const pressedCoordinate = { latitude, longitude };

    if (pendingMarkerCoordinate && isCoordinateNearTarget(pressedCoordinate, pendingMarkerCoordinate, visibleLatitudeDelta)) {
      handleOpenMarkerModal();
      return;
    }

    setPendingMarkerCoordinate(pressedCoordinate);
    setIsMarkerModalVisible(false);
    setIsActionMenuOpen(false);
  }

  function handleOpenMarkerModal() {
    if (!pendingMarkerCoordinate) {
      return;
    }

    setMarkerNameDraft("");
    setMarkerColorDraft(MARKER_COLOR_OPTIONS[0]);
    setIsMarkerModalVisible(true);
  }

  function handleSaveMarker() {
    if (!pendingMarkerCoordinate || !markerNameDraft.trim()) {
      return;
    }

    onAddCustomMarker(pendingMarkerCoordinate, markerNameDraft, markerColorDraft);
    setIsMarkerModalVisible(false);
    setPendingMarkerCoordinate(null);
    setMarkerNameDraft("");
    setMarkerColorDraft(MARKER_COLOR_OPTIONS[0]);
  }

  const locationTextColor = StyleSheet.flatten(styles.locationButtonText)?.color || "#b7b5c8";
  const compassRotation = isHeadingFollowEnabled ? -deviceHeading : 0;
  const customMarkerSize = Math.max(18, Math.min(34, 34 - Math.log10(Math.max(visibleLatitudeDelta, 0.003)) * 8));
  const customMarkerLabelFontSize = Math.max(9, Math.min(11, customMarkerSize * 0.34));
  const customMarkerLabelPadding = Math.max(5, Math.min(8, customMarkerSize * 0.22));

  return (
    <View style={styles.mapCard}>
      <MapView
        ref={mapRef}
        style={styles.realMap}
        initialRegion={region}
        customMapStyle={MAP_DARK_STYLE}
        onPress={handleMapPress}
        onRegionChangeComplete={(nextRegion) => {
          setVisibleLatitudeDelta(nextRegion.latitudeDelta);
        }}
        rotateEnabled={isHeadingFollowEnabled}
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
            {routeCoordinates.length === 2 && <Polyline coordinates={routeCoordinates} strokeColor="#20c8f4" strokeWidth={5} />}
            <Marker coordinate={parkingCoordinate} title="Parkplatz">
              <View style={styles.parkingMarker}>
                <Text style={styles.parkingMarkerText}>P</Text>
              </View>
            </Marker>
          </>
        )}

        {markerDisplayMode !== "hidden" &&
          customMarkers.map((marker) => (
            <Marker key={marker.id} coordinate={marker} title={marker.name}>
              <View style={customStyles.customMarkerWrap}>
                {markerDisplayMode === "labels" ? (
                  <Text
                    numberOfLines={2}
                    style={[
                      customStyles.customMarkerLabel,
                      { fontSize: customMarkerLabelFontSize, paddingHorizontal: customMarkerLabelPadding, paddingVertical: customMarkerLabelPadding * 0.5 }
                    ]}
                  >
                    {marker.name}
                  </Text>
                ) : null}
                <MaterialCommunityIcons name="map-marker" size={customMarkerSize} color={marker.color} />
              </View>
            </Marker>
          ))}

        {pendingMarkerCoordinate ? (
          <Marker coordinate={pendingMarkerCoordinate}>
            <View style={customStyles.pendingMarkerWrap}>
              <MaterialCommunityIcons name="map-marker-plus" size={30} color="#f7f8ff" />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <View style={customStyles.compassBadge}>
        <View style={[customStyles.compassArrowWrap, { transform: [{ rotate: `${compassRotation}deg` }] }]}>
          <MaterialCommunityIcons name="navigation-variant" size={18} color="#20c8f4" />
        </View>
        <Text style={customStyles.compassText}>{Math.round(deviceHeading)} deg</Text>
      </View>

      <View style={customStyles.buttonContainer}>
        <TouchableOpacity
          style={[customStyles.iconButton, isActionMenuOpen && customStyles.iconButtonActive]}
          onPress={() => setIsActionMenuOpen((current) => !current)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name={isActionMenuOpen ? "close" : "dots-horizontal"} size={24} color={isActionMenuOpen ? "#071018" : locationTextColor} />
        </TouchableOpacity>

        {[
          {
            key: "compass",
            iconName: isHeadingFollowEnabled ? "compass" : "compass-off-outline",
            onPress: () => setIsHeadingFollowEnabled((current) => !current)
          },
          {
            key: "markers",
            iconName: markerDisplayMode === "hidden" ? "map-marker-off-outline" : markerDisplayMode === "icons" ? "map-marker-multiple-outline" : "format-text",
            onPress: () => setMarkerDisplayMode((current) => getNextMarkerMode(current))
          },
          {
            key: "parking",
            iconName: "parking",
            onPress: handleOpenSwissParkingSearch
          },
          {
            key: "location",
            iconName: "crosshairs-gps",
            onPress: async () => {
              const refreshedLocation = await onRefreshLocation();
              const targetLocation = refreshedLocation ?? currentLocation;
              if (targetLocation) {
                mapRef.current?.animateToRegion(
                  {
                    latitude: targetLocation.latitude,
                    longitude: targetLocation.longitude,
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012
                  },
                  350
                );
              }
              setIsActionMenuOpen(false);
            }
          }
        ].map((action, index) => (
          <Animated.View
            key={action.key}
            pointerEvents={isActionMenuOpen ? "auto" : "none"}
            style={[
              customStyles.dropdownButtonWrap,
              {
                opacity: actionMenuAnimation,
                transform: [
                  {
                    translateY: actionMenuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-8 - index * 8, 0]
                    })
                  },
                  {
                    scale: actionMenuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.86, 1]
                    })
                  }
                ]
              }
            ]}
          >
            <TouchableOpacity
              style={customStyles.iconButton}
              onPress={action.onPress}
              disabled={!isActionMenuOpen || (action.key === "location" && isLocating)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={action.iconName as never} size={24} color={locationTextColor} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <Modal animationType="fade" transparent visible={isMarkerModalVisible} onRequestClose={() => setIsMarkerModalVisible(false)}>
        <Pressable style={customStyles.modalBackdrop} onPress={() => setIsMarkerModalVisible(false)}>
          <Pressable style={customStyles.modalCard} onPress={() => undefined}>
            <Text style={customStyles.modalTitle}>Marker hinzufügen</Text>
            <Text style={customStyles.modalSubtitle}>Gib deinem Ort einen Namen und wähle eine Farbe.</Text>

            <TextInput
              autoFocus
              onChangeText={setMarkerNameDraft}
              placeholder="z.B. Lieblingsparkplatz"
              placeholderTextColor="#777589"
              style={customStyles.modalInput}
              value={markerNameDraft}
            />

            <Text style={customStyles.colorLabel}>Farbe</Text>
            <View style={customStyles.colorRow}>
              {MARKER_COLOR_OPTIONS.map((color) => {
                const isActive = markerColorDraft === color;

                return (
                  <TouchableOpacity
                    key={color}
                    style={[customStyles.colorOption, { backgroundColor: color }, isActive && customStyles.colorOptionActive]}
                    onPress={() => setMarkerColorDraft(color)}
                    activeOpacity={0.8}
                  />
                );
              })}
            </View>

            <View style={customStyles.modalActions}>
              <TouchableOpacity style={customStyles.modalSecondaryButton} onPress={() => setIsMarkerModalVisible(false)} activeOpacity={0.8}>
                <Text style={customStyles.modalSecondaryButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[customStyles.modalPrimaryButton, !markerNameDraft.trim() && customStyles.modalPrimaryButtonDisabled]}
                onPress={handleSaveMarker}
                disabled={!markerNameDraft.trim()}
                activeOpacity={0.8}
              >
                <Text style={customStyles.modalPrimaryButtonText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const customStyles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    position: "absolute",
    right: 16,
    top: 18
  },
  dropdownButtonWrap: {
    marginTop: 10,
    width: 48
  },
  compassBadge: {
    alignItems: "center",
    backgroundColor: "rgba(17, 17, 29, 0.92)",
    borderColor: "#242439",
    borderRadius: 18,
    borderWidth: 1,
    left: 16,
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "absolute",
    top: 18
  },
  compassArrowWrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  compassText: {
    color: "#f7f8ff",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(17, 17, 29, 0.92)",
    borderColor: "#242439",
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  iconButtonActive: {
    backgroundColor: "#20c8f4"
  },
  customMarkerWrap: {
    alignItems: "center"
  },
  customMarkerLabel: {
    backgroundColor: "rgba(17, 17, 29, 0.92)",
    borderColor: "#242439",
    borderRadius: 12,
    borderWidth: 1,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
    marginBottom: -3,
    maxWidth: 144,
    minWidth: 68,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "center"
  },
  pendingMarkerWrap: {
    alignItems: "center",
    backgroundColor: "rgba(32, 200, 244, 0.3)",
    borderRadius: 18,
    padding: 2
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(4, 6, 12, 0.62)",
    flex: 1,
    justifyContent: "center",
    padding: 22
  },
  modalCard: {
    backgroundColor: "#11111d",
    borderColor: "#242439",
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    width: "100%"
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900"
  },
  modalSubtitle: {
    color: "#9aa8b6",
    fontSize: 13,
    marginTop: 6
  },
  modalInput: {
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  colorLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 16
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10
  },
  colorOption: {
    borderRadius: 14,
    height: 28,
    width: 28
  },
  colorOptionActive: {
    borderColor: "#ffffff",
    borderWidth: 3
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20
  },
  modalPrimaryButton: {
    alignItems: "center",
    backgroundColor: "#20c8f4",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 13
  },
  modalPrimaryButtonDisabled: {
    opacity: 0.45
  },
  modalPrimaryButtonText: {
    color: "#071018",
    fontSize: 14,
    fontWeight: "900"
  },
  modalSecondaryButton: {
    alignItems: "center",
    backgroundColor: "#1b1b2d",
    borderColor: "#28283c",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 13
  },
  modalSecondaryButtonText: {
    color: "#b7b5c8",
    fontSize: 14,
    fontWeight: "900"
  }
});
