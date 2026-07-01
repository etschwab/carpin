import { Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";

import { MAP_DARK_STYLE } from "../constants/appConstants";
import { styles } from "../styles/appStyles";
import type { Coordinate, ParkingSpot } from "../types/parking";

type CarPinMapProps = {
  currentLocation: Coordinate | null;
  isLocating: boolean;
  onRefreshLocation: () => void;
  parkingSpot: ParkingSpot | null;
  region: Region;
};

export function CarPinMap({ currentLocation, isLocating, onRefreshLocation, parkingSpot, region }: CarPinMapProps) {
  const parkingCoordinate = parkingSpot ? { latitude: parkingSpot.latitude, longitude: parkingSpot.longitude } : null;
  const routeCoordinates = currentLocation && parkingCoordinate ? [currentLocation, parkingCoordinate] : [];

  return (
    <View style={styles.mapCard}>
      <MapView
        style={styles.realMap}
        initialRegion={region}
        region={region}
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

      <View style={styles.mapOverlayLabel}>
        <Text style={styles.mapOverlayEyebrow}>Kartenansicht</Text>
        <Text style={styles.mapOverlayText}>
          {parkingSpot?.address || (currentLocation ? "Aktueller Standort" : "Standort wird gesucht")}
        </Text>
      </View>

      <TouchableOpacity style={styles.locationButton} onPress={onRefreshLocation} disabled={isLocating}>
        <Text style={styles.locationButtonText}>{isLocating ? "..." : "Standort"}</Text>
      </TouchableOpacity>
    </View>
  );
}
