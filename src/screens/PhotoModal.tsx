import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/appStyles";
import type { ParkingSpot } from "../types/parking";

type PhotoModalProps = {
  isVisible: boolean;
  onClose: () => void;
  parkingSpot: ParkingSpot | null;
};

export function PhotoModal({ isVisible, onClose, parkingSpot }: PhotoModalProps) {
  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.photoModalBackdrop}>
        <View style={styles.photoModal}>
          <Text style={styles.photoModalTitle}>Parkplatzfoto</Text>
          {parkingSpot?.photoUri && <Image source={{ uri: parkingSpot.photoUri }} style={styles.photoPreview} />}
          <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Schliessen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
