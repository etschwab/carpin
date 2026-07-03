import { Text, View } from "react-native";

import { styles } from "../styles/appStyles";

type MetricProps = {
  label: string;
  value: string;
};

// Metric / Distanz / kleine Anzeige Werte
export function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}
