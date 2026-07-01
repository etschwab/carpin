import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/appStyles";
import type { ParkingSpot } from "../types/parking";

type PhotoModalProps = {
  isVisible: boolean;
  onClose: () => void;
  parkingSpot: ParkingSpot | null;
  photoUri?: string | null;
};

export function PhotoModal({ isVisible, onClose, parkingSpot, photoUri }: PhotoModalProps) {
  const visiblePhotoUri = parkingSpot?.photoUri ?? photoUri;

  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.photoModalBackdrop}>
        <View style={styles.photoModal}>
          <Text style={styles.photoModalTitle}>Parkplatzfoto</Text>
          {visiblePhotoUri && <Image source={{ uri: visiblePhotoUri }} style={styles.photoPreview} />}
          <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Schliessen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
