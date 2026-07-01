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

        {/* Neuer, moderner Info-Knopf auf der rechten Seite */}
        <TouchableOpacity 
          style={customStyles.infoButton} 
          onPress={() => setImpressumVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={customStyles.infoButtonText}>[ i ]</Text>
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

// Zusätzliche Styles, damit das Icon perfekt rechts sitzt, ohne eure App-Styles zu zerstören
const customStyles = StyleSheet.create({
  headerLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 10, // Gibt dem Button etwas Abstand zum rechten Rand
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#111116',
    borderWidth: 1,
    borderColor: '#00E5FF', // Matcht euer Neon-Cyan
  },
  infoButtonText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});