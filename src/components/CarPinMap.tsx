import { useRef } from "react";
import { Platform, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
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

  const iconColor = StyleSheet.flatten(styles.locationButtonText)?.color || "#b7b5c8";
  
  const parkingCoordinate = parkingSpot ? { latitude: parkingSpot.latitude, longitude: parkingSpot.longitude } : null;
  const routeCoordinates = currentLocation && parkingCoordinate ? [currentLocation, parkingCoordinate] : [];

  const handleOpenSwissParkingSearch = () => {
    const query = encodeURIComponent("Parking");
    const regionName = encodeURIComponent("Switzerland");
    const url = Platform.select({
      ios: `maps://?q=${query}&near=${regionName}`,
      android: `geo:0,0?q=${query}+${regionName}`
    });
    if (url) Linking.openURL(url).catch((err) => console.error("Fehler:", err));
  };

  return (
    <View style={styles.mapCard}>
      <MapView
        ref={mapRef}
        style={styles.realMap}
        initialRegion={region}
        customMapStyle={MAP_DARK_STYLE}
        showsCompass={false}
        showsMyLocationButton={false}
      >
        {currentLocation && (
          <Marker coordinate={currentLocation} title="Dein Standort">
            <View style={styles.userMarker}><View style={styles.userMarkerInner} /></View>
          </Marker>
        )}
        {parkingCoordinate && (
          <>
            {routeCoordinates.length === 2 && <Polyline coordinates={routeCoordinates} strokeColor="#20c8f4" strokeWidth={5} />}
            <Marker coordinate={parkingCoordinate} title="Parkplatz">
              <View style={styles.parkingMarker}><View style={styles.parkingMarkerInner} /></View>
            </Marker>
          </>
        )}
      </MapView>

      {/* 1. PARKING-BUTTON */}
      <TouchableOpacity style={[styles.locationButton, customStyles.iconButton, { top: 12 }]} onPress={handleOpenSwissParkingSearch}>
        <MaterialCommunityIcons name="parking" size={28} color={iconColor} />
      </TouchableOpacity>

      {/* 2. ZENTRIEREN-BUTTON */}
      <TouchableOpacity 
        style={[styles.locationButton, customStyles.iconButton, { top: 80 }]} 
        onPress={async () => {
          const loc = await onRefreshLocation();
          if (loc) mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 350);
        }}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={28} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const customStyles = StyleSheet.create({
  iconButton: {
    position: "absolute",
    left: 12,
    height: 56,
    width: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    padding: 0,
  }
});