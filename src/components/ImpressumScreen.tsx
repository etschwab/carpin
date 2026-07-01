import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Modal,
  ViewStyle,
  TextStyle,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// TypeScript Props: Steuerung von aussen (aus dem Header)
interface ImpressumProps {
  visible: boolean;
  onClose: () => void;
}

export default function ImpressumScreen({ visible, onClose }: ImpressumProps): React.JSX.Element {
  // Animations-Referenzen
  const fadeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
  const slideAnim = useRef<Animated.Value>(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      // Einblenden-Animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Ausblenden-Animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Abgedunkelter Hintergrund */}
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.absoluteClose} activeOpacity={1} onPress={onClose} />
        
        {/* Die animierte Card im App-Style ohne Leuchten */}
        <Animated.View style={[styles.cyberCard, { transform: [{ translateY: slideAnim }] }]}>
          
          {/* Header der Card mit Schliessen-Button */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>                   Impressum</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>[01] HERAUSGEBERIN & KONTAKT</Text>
              <Text style={styles.bodyText}>CarPin Schweiz AG</Text>
              <Text style={styles.bodyText}>c/o ICT-LearnFactory AG</Text>
              <Text style={styles.bodyText}>Waldeggstrasse 37, 3065 Deisswil</Text>
              <Text style={styles.bodyText}>E-Mail: support@carpin.ch</Text>
              <Text style={styles.bodyText}>Web: www.carpin.ch</Text>
            </View>

            <View style={styles.cyberDivider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>[02] VERTRETUNGSBERECHTIGTE PERSONEN</Text>
              <Text style={styles.bodyText}>• Miguel Cabañero (Testing)</Text>
              <Text style={styles.bodyText}>• Arion Zeqaj (Frontend)</Text>
              <Text style={styles.bodyText}>• Etienne Schwab (Backend)</Text>
            </View>

            <View style={styles.cyberDivider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>[03] HANDELSREGISTER & MWST</Text>
              <Text style={styles.bodyText}>Eingetragener Firmenname: CarPin Schweiz AG</Text>
              <Text style={styles.bodyText}>Handelsregisteramt: Kanton Bern</Text>
              <Text style={styles.bodyText}>Firmennummer (UID): CHE-123.456.789 MWST</Text>
            </View>

            <View style={styles.cyberDivider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>[04] ALLGEMEINE GESCHÄFTSBEDINGUNGEN (AGB)</Text>
              <Text style={styles.bodyText}>
                Mit der Nutzung von CarPin erklären Sie sich mit unseren AGB einverstanden. Die App stellt lediglich eine Orientierungshilfe dar. Für verpasste Parkzeiten, Bussgelder, Abschleppkosten oder Ungenauigkeiten bei der GPS-Ortung (z.B. in geschlossenen Tiefgaragen) übernimmt die Betreiberin keinerlei Haftung.
              </Text>
            </View>

            <View style={styles.cyberDivider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>[05] DATENSCHUTZERKLÄRUNG (DSG)</Text>
              <Text style={styles.bodyText}>
                Verantwortlich für die Datenverarbeitung ist die CarPin Schweiz AG. Diese App verarbeitet temporäre GPS-Standortdaten und Kamerabilder ausschliesslich lokal auf Ihrem Endgerät, um die Kernfunktionen bereitzustellen. Eine Übermittlung von Bewegungsprofilen an externe Server findet nicht statt.
              </Text>
            </View>

          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Interface für präzise TypeScript-Typisierung des Stylesheets
interface Styles {
  modalOverlay: ViewStyle;
  absoluteClose: ViewStyle;
  cyberCard: ViewStyle;
  cardHeader: ViewStyle;
  cardTitle: TextStyle;
  closeButton: ViewStyle;
  closeButtonText: TextStyle;
  scrollContent: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  bodyText: TextStyle;
  cyberDivider: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 9, 17, 0.85)', // Matcht euren Backdrop-Wert
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  absoluteClose: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cyberCard: {
    width: width * 0.88,
    maxHeight: height * 0.65,
    backgroundColor: '#151523', // Euer Standard-Panel Hintergrund
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242439', // Diskreter Rahmen eurer Kacheln
    padding: 20,
    // Leuchten (Shadows & Elevation) komplett entfernt
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#242439',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#20c8f4', // Einheitliches Cyan eurer App
    letterSpacing: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1b1b2d', // Matcht euren secondaryButton
  },
  closeButtonText: {
    color: '#b7b5c8', // Matcht euren secondaryButtonText
    fontSize: 14,
    fontWeight: '900',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  section: {
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#20c8f4', // Alle Titel [01], [02] etc. einheitlich Cyan
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    color: '#ffffff', // Alle Texte (auch Namen & AGBs) jetzt reinweiss
    fontWeight: '500', // Dünnere, saubere Schriftstärke für bessere Lesbarkeit
    lineHeight: 20,
  },
  cyberDivider: {
    height: 1,
    backgroundColor: '#242439',
    marginVertical: 14,
  },
});