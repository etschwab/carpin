import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

import { styles } from "../../styles/appStyles";
import type { ParkingSpot, Screen, Vehicle } from "../../types/parking";
import { formatTime } from "../../utils/time";
import { WideNavButton } from "./WideNavButton";

// Querformat Navi
const WIDE_NAV_ITEMS: Array<{ icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; screen: Screen }> = [
  { icon: "map-marker-outline", label: "Karte", screen: "dashboard" },
  { icon: "car-outline", label: "Fahrzeuge", screen: "vehicles" },
  { icon: "format-list-bulleted", label: "Verlauf", screen: "history" },
  { icon: "timer-outline", label: "Timer", screen: "timer" }
];

type WideSidebarProps = {
  activeScreen: Screen;
  isSavingSpot: boolean;
  onNavigate: (screen: Screen) => void;
  onOpenRoute: () => void;
  onSaveParkingSpot: () => void;
  parkedVehicle: Vehicle | undefined;
  parkingSpot: ParkingSpot | null;
  selectedVehicle: Vehicle | undefined;
};

export function WideSidebar({
  activeScreen,
  isSavingSpot,
  onNavigate,
  onOpenRoute,
  onSaveParkingSpot,
  parkedVehicle,
  parkingSpot,
  selectedVehicle
}: WideSidebarProps) {
  return (
    <View style={styles.wideSidebar}>
      <View style={styles.wideBrandRow}>
        <Image source={require("../../../assets/carpin.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.wideBrandTitle}>CarPin</Text>
      </View>

      <View style={styles.wideNavList}>
        {WIDE_NAV_ITEMS.map((item) => (
          <WideNavButton
            key={item.screen}
            icon={item.icon}
            isActive={activeScreen === item.screen}
            label={item.label}
            onPress={() => onNavigate(item.screen)}
          />
        ))}
      </View>

      <View style={styles.wideSidebarSpacer} />

      <View style={[styles.wideStatusCard, activeScreen === "dashboard" && styles.hidden]}>
        <Text style={styles.wideStatusEyebrow}>{parkingSpot ? "Aktiv" : "Bereit"}</Text>
        <Text style={styles.wideStatusTitle}>{parkingSpot ? parkedVehicle?.name ?? "Fahrzeug" : selectedVehicle?.name ?? "Fahrzeug"}</Text>
        <Text style={styles.wideStatusMeta}>
          {parkingSpot ? `${parkingSpot.address ?? "Parkplatz"} · ${formatTime(parkingSpot.savedAt).split(",").pop()?.trim()}` : "Noch kein Parkplatz gespeichert"}
        </Text>
        <TouchableOpacity style={styles.wideStatusButton} onPress={parkingSpot ? onOpenRoute : onSaveParkingSpot} disabled={isSavingSpot}>
          <Text style={styles.wideStatusButtonText}>{parkingSpot ? "Route starten" : isSavingSpot ? "Speichere..." : "Parkplatz speichern"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
