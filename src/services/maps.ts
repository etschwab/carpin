import { Alert, Linking } from "react-native";

import type { Coordinate } from "../types/parking";

// Route / Apple Maps / Fussweg zum Ziel
export function getAppleMapsRouteUrl(coordinate: Coordinate) {
  return `http://maps.apple.com/?daddr=${coordinate.latitude},${coordinate.longitude}&dirflg=w`;
}

export function openRouteTo(coordinate: Coordinate) {
  Linking.openURL(getAppleMapsRouteUrl(coordinate)).catch(() => {
    Alert.alert("Route nicht möglich", "Apple Maps konnte nicht geöffnet werden.");
  });
}
