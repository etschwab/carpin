import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
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

export function CarPinMap({ currentLocation, isLocating, onRefreshLocation, parkingSpot, region }: CarPinMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const [mapHeading, setMapHeading] = useState(0);
  const parkingCoordinate = parkingSpot ? { latitude: parkingSpot.latitude, longitude: parkingSpot.longitude } : null;
  const routeCoordinates = currentLocation && parkingCoordinate ? [currentLocation, parkingCoordinate] : [];

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 350);
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  const updateHeadingFromCamera = useCallback(async () => {
    try {
      const camera = await mapRef.current?.getCamera();
      setMapHeading(camera?.heading ?? 0);
    } catch {
      setMapHeading(0);
    }
  }, []);

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

  return (
    <View style={styles.mapCard}>
      <MapView
        ref={mapRef}
        style={styles.realMap}
        initialRegion={region}
        customMapStyle={MAP_DARK_STYLE}
        onMapReady={() => {
          updateHeadingFromCamera().catch(() => undefined);
        }}
        onRegionChangeComplete={() => {
          updateHeadingFromCamera().catch(() => undefined);
        }}
        rotateEnabled
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

      <TouchableOpacity
        style={customStyles.compassBadge}
        onPress={() => {
          mapRef.current?.animateCamera({ heading: 0 }, { duration: 250 });
          setMapHeading(0);
        }}
        activeOpacity={0.8}
      >
        <View style={[customStyles.compassArrowWrap, { transform: [{ rotate: `${mapHeading}deg` }] }]}>
          <MaterialCommunityIcons name="navigation-variant" size={18} color="#20c8f4" />
        </View>
        <Text style={customStyles.compassText}>N</Text>
      </TouchableOpacity>

      <View style={customStyles.buttonContainer}>
        <TouchableOpacity style={customStyles.iconButton} onPress={handleOpenSwissParkingSearch} activeOpacity={0.7}>
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
  secondaryIconButton: {
    marginTop: 10
  }
});
