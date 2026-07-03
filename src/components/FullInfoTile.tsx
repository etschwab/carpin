import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { styles } from "../styles/appStyles";

type FullInfoTileProps = {
  icon?: string;
  iconElement?: ReactNode;
  label: string;
  value: string;
};

// Dashboard / Info Kachel / Foto Timer Fahrzeug Status
export function FullInfoTile({ icon, iconElement, label, value }: FullInfoTileProps) {
  return (
    <View style={styles.fullInfoTile}>
      <View style={styles.fullInfoIcon}>
        {iconElement ?? <Text style={styles.fullInfoIconText}>{icon}</Text>}
      </View>
      <Text style={styles.fullInfoLabel}>{label}</Text>
      <Text style={styles.fullInfoValue}>{value}</Text>
    </View>
  );
}
