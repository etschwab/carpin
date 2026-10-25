import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/appStyles";
import type { ParkingSpot } from "../types/parking";

type PhotoModalProps = {
  isVisible: boolean;
  isWideLayout?: boolean;
  onClose: () => void;
  parkingSpot: ParkingSpot | null;
  photoUri?: string | null;
};

// Foto / Popup / Parkplatzbild anzeigen
export function PhotoModal({ isVisible, isWideLayout = false, onClose, parkingSpot, photoUri }: PhotoModalProps) {
  // Foto / Quelle / Parkplatzfoto oder Vorschau
  const visiblePhotoUri = parkingSpot?.photoUri ?? photoUri;

  return (
    <Modal visible={isVisible} animationType={isWideLayout ? "fade" : "slide"} transparent onRequestClose={onClose}>
      <View style={isWideLayout ? styles.widePhotoModalBackdrop : styles.photoModalBackdrop}>
        <View style={isWideLayout ? styles.widePhotoModal : styles.photoModal}>
          <View style={isWideLayout ? styles.widePhotoModalHeader : undefined}>
            <View>
              <Text style={styles.photoModalTitle}>Parkplatzfoto</Text>
              {isWideLayout && parkingSpot ? <Text style={styles.widePhotoModalMeta}>{parkingSpot.address}</Text> : null}
            </View>
            {isWideLayout ? (
              <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                <Text style={styles.modalCloseButtonText}>×</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {visiblePhotoUri ? <Image source={{ uri: visiblePhotoUri }} style={isWideLayout ? styles.widePhotoPreview : styles.photoPreview} /> : null}

          <TouchableOpacity style={isWideLayout ? styles.widePhotoCloseButton : styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Schliessen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
