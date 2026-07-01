import { Text, View } from "react-native";

import { styles } from "../styles/appStyles";

type FullInfoTileProps = {
  icon: string;
  label: string;
  value: string;
};

export function FullInfoTile({ icon, label, value }: FullInfoTileProps) {
  return (
    <View style={styles.fullInfoTile}>
      <View style={styles.fullInfoIcon}>
        <Text style={styles.fullInfoIconText}>{icon}</Text>
      </View>
      <Text style={styles.fullInfoLabel}>{label}</Text>
      <Text style={styles.fullInfoValue}>{value}</Text>
    </View>
  );
}
