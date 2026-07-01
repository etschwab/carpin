import { useEffect, useRef } from "react";
import { Platform, Linking, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  const parkingCoordinate = parkingSpot ? { latitude: parkingSpot.latitude, longitude: parkingSpot.longitude } : null;
  const routeCoordinates = currentLocation && parkingCoordinate ? [currentLocation, parkingCoordinate] : [];

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 350);
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

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

  const locationTextColor = StyleSheet.flatten(styles.locationButtonText)?.color || "#b7b5c8";

  return (
    <View style={styles.mapCard}>
      <MapView
        ref={mapRef}
        style={styles.realMap}
        initialRegion={region}
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
            {routeCoordinates.length === 2 && <Polyline coordinates={routeCoordinates} strokeColor="#20c8f4" strokeWidth={5} />}
            <Marker coordinate={parkingCoordinate} title="Parkplatz">
              <View style={styles.parkingMarker}>
                <Text style={styles.parkingMarkerText}>P</Text>
              </View>
            </Marker>
          </>
        )}
      </MapView>

      {/* Container für die Buttons oben rechts */}
      <View style={customStyles.buttonContainer}>
        {/* PARKING-BUTTON */}
        <TouchableOpacity 
          style={customStyles.iconButton} 
          onPress={handleOpenSwissParkingSearch}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="parking" size={24} color={locationTextColor} />
        </TouchableOpacity>

        {/* ZENTRIER-BUTTON (unter Parking) */}
        <TouchableOpacity 
          style={[customStyles.iconButton, { marginTop: 10 }]} 
          onPress={async () => {
            const refreshedLocation = await onRefreshLocation();
            const targetLocation = refreshedLocation ?? currentLocation;
            if (targetLocation) {
              mapRef.current?.animateToRegion({
                latitude: targetLocation.latitude,
                longitude: targetLocation.longitude,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012
              }, 350);
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
    position: "absolute",
    right: 16,
    top: 18,
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "rgba(17, 17, 29, 0.92)",
    borderColor: "#242439",
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});