import { View } from "react-native";

import { styles } from "../../styles/appStyles";
import type { Screen } from "../../types/parking";
import { TabButton } from "../TabButton";

const MOBILE_TABS: Array<{ label: string; screen: Screen }> = [
  { label: "Parken", screen: "dashboard" },
  { label: "Timer", screen: "timer" },
  { label: "Fahrzeuge", screen: "vehicles" },
  { label: "History", screen: "history" }
];

type MobileTabsProps = {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
};

// Hochformat Navi / Tabs oben
export function MobileTabs({ activeScreen, onNavigate }: MobileTabsProps) {
  return (
    <View style={styles.tabs}>
      {MOBILE_TABS.map((tab) => (
        <TabButton key={tab.screen} label={tab.label} isActive={activeScreen === tab.screen} onPress={() => onNavigate(tab.screen)} />
      ))}
    </View>
  );
}
