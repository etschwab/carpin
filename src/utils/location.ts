import * as Location from "expo-location";

// Adresse suche
export async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) {
      return undefined;
    }

    return [place.street, place.streetNumber, place.city].filter(Boolean).join(" ");
  } catch {
    return undefined;
  }
}
