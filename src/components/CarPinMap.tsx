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

  // Suchfunktion für alle Parkplätze in der Schweiz beim Weiterleiten
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

  // Holt die Textfarbe vom Standort-Button-Text für das Icon
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

      {/* PARKING-BUTTON: Wieder im quadratischen Layout, schön gross und perfekt ausgerichtet */}
      <TouchableOpacity 
        style={[styles.locationButton, customStyles.parkingButtonLayout]} 
        onPress={handleOpenSwissParkingSearch}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="parking" size={24} color={locationTextColor} />
      </TouchableOpacity>

      {/* Der Zentrier-Button unten rechts */}
      <TouchableOpacity 
        style={styles.locationButton} 
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
      >
        <Text style={styles.locationButtonText}>{isLocating ? "..." : "Standort"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const customStyles = StyleSheet.create({
  parkingButtonLayout: {
    // Absolutes Positioning entkoppelt von unten rechts
    position: "absolute",
    top: 12,
    left: 12,
    right: "auto",
    bottom: "auto",
    
    // Festgelegte, grössere quadratische Dimensionen (wie gewünscht)
    height: 46,
    width: 46,
    borderRadius: 12,
    
    // Setzt das Padding zurück, damit das Icon exakt in der Mitte sitzt
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
    
    zIndex: 10,
  },
});