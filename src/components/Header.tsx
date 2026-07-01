import React, { useState } from "react";
import { Image, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { styles } from "../styles/appStyles";
// Impressum importieren (Pfad passt perfekt zu eurer Struktur)
import ImpressumScreen from "./ImpressumScreen";

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  // State für die Sichtbarkeit des Impressums
  const [impressumVisible, setImpressumVisible] = useState<boolean>(false);

  return (
    <View style={styles.header}>
      <View style={[styles.brandRow, customStyles.headerLayout]}>
        {/* Eure bestehende Logo- und Titel-Sektion */}
        <View style={customStyles.leftContainer}>
          <Image source={require("../../carpin.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Impressum-Button im exakten Stil der anderen Buttons (ohne grelles Leuchten) */}
        <TouchableOpacity 
          style={customStyles.infoButton} 
          onPress={() => setImpressumVisible(true)}
          activeOpacity={0.7} // Gleicher Drück-Effekt (Hover/Touch) wie überall sonst
        >
          <Text style={customStyles.infoButtonText}>§</Text>
        </TouchableOpacity>
      </View>

      {/* Das Impressum-Modal, das sich bei Klick über alles legt */}
      <ImpressumScreen 
        visible={impressumVisible} 
        onClose={() => setImpressumVisible(false)} 
      />
    </View>
  );
}

// Zusätzliche Styles, perfekt abgestimmt auf eure appStyles
const customStyles = StyleSheet.create({
  headerLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 4, // Leicht angepasst, damit es bündig mit dem Grid abschliesst
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 34, // Passt sich der Höhe des Logos an
    width: 34,
    borderRadius: 10, // Leicht abgerundet wie eure anderen kleinen Icons
    backgroundColor: '#1b1b2d', // Dunkelblau (wie secondaryButton / fullInfoTile)
    borderWidth: 1,
    borderColor: '#28283c', // Diskreter, dunkler Rahmen (wie secondaryButton / fullInfoTile)
  },
  infoButtonText: {
    color: '#b7b5c8', // Gleiche Textfarbe wie secondaryButtonText für 100% Konsistenz
    fontSize: 15,
    fontWeight: '900',
  },
});