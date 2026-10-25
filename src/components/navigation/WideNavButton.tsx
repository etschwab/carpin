import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

import { styles } from "../../styles/appStyles";

type WideNavButtonProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  isActive: boolean;
  label: string;
  onPress: () => void;
};

export function WideNavButton({ icon, isActive, label, onPress }: WideNavButtonProps) {
  return (
    <TouchableOpacity style={[styles.wideNavButton, isActive && styles.wideNavButtonActive]} onPress={onPress}>
      <MaterialCommunityIcons color={isActive ? "#20c8f4" : "#8f8da0"} name={icon} size={20} />
      <Text style={[styles.wideNavText, isActive && styles.wideNavTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
