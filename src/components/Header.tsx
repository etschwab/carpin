import React, { useState } from "react";
import { Image, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { styles } from "../styles/appStyles";
// Impressum Popup
import ImpressumScreen from "../screens/ImpressumScreen";

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  // Popup Status
  const [impressumVisible, setImpressumVisible] = useState<boolean>(false);

  return (
    <View style={styles.header}>
      <View style={[styles.brandRow, customStyles.headerLayout]}>
        {/* Logo Titel */}
        <View style={customStyles.leftContainer}>
          <Image source={require("../../assets/carpin.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Info Knopf */}
        <TouchableOpacity 
          style={customStyles.infoButton} 
          onPress={() => setImpressumVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={customStyles.infoButtonText}>§</Text>
        </TouchableOpacity>
      </View>

      {/* Popup Fenster */}
      <ImpressumScreen 
        visible={impressumVisible} 
        onClose={() => setImpressumVisible(false)} 
      />
    </View>
  );
}

// Header Styles
const customStyles = StyleSheet.create({
  headerLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 4,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    width: 34,
    borderRadius: 10,
    backgroundColor: '#1b1b2d',
    borderWidth: 1,
    borderColor: '#28283c',
  },
  infoButtonText: {
    color: '#b7b5c8',
    fontSize: 15,
    fontWeight: '900',
  },
});
