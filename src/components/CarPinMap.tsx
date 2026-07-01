import { useRef } from "react";
import { Platform, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { MAP_DARK_STYLE } from "../constants/appConstants";
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
    <View style={localStyles.mapCard}>
      <MapView
        ref={mapRef}
        style={localStyles.realMap}
        initialRegion={region}
        customMapStyle={MAP_DARK_STYLE}
        showsCompass={false}
        showsMyLocationButton={false}
      >
        {currentLocation && (
          <Marker coordinate={currentLocation} title="Dein Standort">
            <View style={localStyles.userMarker}><View style={localStyles.userMarkerInner} /></View>
          </Marker>
        )}
        {parkingCoordinate && (
          <>
            {routeCoordinates.length === 2 && <Polyline coordinates={routeCoordinates} strokeColor="#20c8f4" strokeWidth={5} />}
            <Marker coordinate={parkingCoordinate} title="Parkplatz">
              <View style={localStyles.parkingMarker}><View style={localStyles.parkingMarkerInner} /></View>
            </Marker>
          </>
        )}
      </MapView>

      <TouchableOpacity style={[localStyles.buttonBase, { top: 12 }]} onPress={handleOpenSwissParkingSearch}>
        <MaterialCommunityIcons name="parking" size={28} color="#20c8f4" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[localStyles.buttonBase, { top: 80 }]} 
        onPress={async () => {
          const loc = await onRefreshLocation();
          if (loc) mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 350);
        }}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={28} color="#20c8f4" />
      </TouchableOpacity>
    </View>
  );
}

const localStyles = StyleSheet.create({
  mapCard: { flex: 1, overflow: 'hidden' },
  realMap: { ...StyleSheet.absoluteFillObject },
  buttonBase: {
    position: "absolute",
    left: 12,
    height: 56,
    width: 56,
    borderRadius: 12,
    backgroundColor: "#1b1b2d",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#28283c'
  },
  userMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(32, 200, 244, 0.3)', alignItems: 'center', justifyContent: 'center' },
  userMarkerInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#20c8f4', borderWidth: 2, borderColor: '#fff' },
  parkingMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', alignItems: 'center', justifyContent: 'center' },
  parkingMarkerInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#ffffff' }
});