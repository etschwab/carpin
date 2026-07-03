import { Text, TouchableOpacity } from "react-native";

import { styles } from "../styles/appStyles";

type TabButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
};

// Navigation / Tab Button / Screen wechseln
export function TabButton({ label, isActive, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity style={[styles.tabButton, isActive && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
