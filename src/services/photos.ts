import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

import type { PhotoSource } from "../types/parking";

// Foto / Kamera / Galerie / gibt die Bild-URI oder null zurueck
export async function pickPhotoUri(source: PhotoSource) {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permission.status !== "granted") {
    Alert.alert("Berechtigung fehlt", "CarPin braucht Zugriff, um ein Parkplatzfoto zu speichern.");
    return null;
  }

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ["images"] });

  if (result.canceled) {
    return null;
  }

  return result.assets[0]?.uri ?? null;
}
