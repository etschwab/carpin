import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";

import { MAP_DARK_STYLE } from "../constants/appConstants";
import { styles } from "../styles/appStyles";
import type { Coordinate, ParkingSpot } from "../types/parking";

type CarPinMapProps = {
  currentLocation: Coordinate | null;
  isLocating: boolean;
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

export function CarPinMap({ currentLocation, isLocating, onRefreshLocation, parkingSpot, region }: CarPinMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const lastAppliedHeadingRef = useRef(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [isHeadingFollowEnabled, setIsHeadingFollowEnabled] = useState(true);
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
    }).then((watcher) => {
      subscription = watcher;
    }).catch(() => undefined);

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [isHeadingFollowEnabled]);

  const handleOpenSwissParkingSearch = () => {
    const query = encodeURIComponent("Parking");
    const regionName = encodeURIComponent("Switzerland");

    const url = Platform.select({
      ios: `maps://?q=${query}&near=${regionName}`,
      android: `geo:0,0?q=${query}+${regionName}`
    });

    if (url) {
      Linking.openURL(url).catch((err) => console.error("Fehler beim Oeffnen der Karte:", err));
    }
  };

  const locationTextColor = StyleSheet.flatten(styles.locationButtonText)?.color || "#b7b5c8";
  const compassRotation = isHeadingFollowEnabled ? -deviceHeading : 0;

  return (
    <View style={styles.mapCard}>
      <MapView
        ref={mapRef}
        style={styles.realMap}
        initialRegion={region}
        customMapStyle={MAP_DARK_STYLE}
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
      </MapView>

      <View style={customStyles.compassBadge}>
        <View style={[customStyles.compassArrowWrap, { transform: [{ rotate: `${compassRotation}deg` }] }]}>
          <MaterialCommunityIcons name="navigation-variant" size={18} color="#20c8f4" />
        </View>
        <Text style={customStyles.compassText}>{Math.round(deviceHeading)}°</Text>
      </View>

      <View style={customStyles.buttonContainer}>
        <TouchableOpacity
          style={[customStyles.iconButton, isHeadingFollowEnabled && customStyles.iconButtonActive]}
          onPress={() => setIsHeadingFollowEnabled((current) => !current)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isHeadingFollowEnabled ? "compass" : "compass-off-outline"}
            size={24}
            color={isHeadingFollowEnabled ? "#071018" : locationTextColor}
          />
        </TouchableOpacity>

        <TouchableOpacity style={[customStyles.iconButton, customStyles.secondaryIconButton]} onPress={handleOpenSwissParkingSearch} activeOpacity={0.7}>
          <MaterialCommunityIcons name="parking" size={24} color={locationTextColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[customStyles.iconButton, customStyles.secondaryIconButton]}
          onPress={async () => {
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
          }}
          disabled={isLocating}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={locationTextColor} />
        </TouchableOpacity>
      </View>
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
  secondaryIconButton: {
    marginTop: 10
  }
});
