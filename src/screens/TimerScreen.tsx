import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/appStyles";
import type { ParkingSpot } from "../types/parking";
import { formatCountdown, formatTime } from "../utils/time";

type TimerScreenProps = {
  customTimerMinutes: string;
  onChangeCustomTimerMinutes: (value: string) => void;
  onStartCustomTimer: () => void;
  onStartTimer: (minutes: number) => void;
  parkingSpot: ParkingSpot | null;
  remainingMs: number;
  timerEnd: string | null;
  timerIsActive: boolean;
  timerSpotMatchesActiveSpot: boolean;
  timerStartedAt: string | null;
};

export function TimerScreen({
  customTimerMinutes,
  onChangeCustomTimerMinutes,
  onStartCustomTimer,
  onStartTimer,
  parkingSpot,
  remainingMs,
  timerEnd,
  timerIsActive,
  timerSpotMatchesActiveSpot,
  timerStartedAt
}: TimerScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.timerRing}>
        <View style={styles.timerArc} />
        <Text style={styles.timerLabel}>Verbleibend</Text>
        <Text style={styles.timerValue}>{timerIsActive ? formatCountdown(remainingMs) : "0:00:00"}</Text>
        <Text style={styles.timerUnit}>Std</Text>
      </View>

      <View style={styles.assignmentCard}>
        <Text style={styles.assignmentLabel}>Zugewiesener Parkplatz</Text>
        <Text style={styles.assignmentTitle}>
          {parkingSpot ? parkingSpot.address || "Gespeicherter Parkplatz" : "Noch kein Parkplatz gespeichert"}
        </Text>
        <Text style={styles.assignmentMeta}>
          {timerSpotMatchesActiveSpot && timerStartedAt
            ? `Gestartet ${formatTime(timerStartedAt)} · Endet ${timerEnd ? formatTime(timerEnd) : "-"}`
            : "Timer wird beim Start diesem Parkplatz zugeteilt."}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Parkzeit wählen</Text>
      <View style={styles.timeButtons}>
        <TouchableOpacity style={styles.timeButton} onPress={() => onStartTimer(30)}>
          <Text style={styles.timeButtonText}>30 min</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.timeButton, styles.timeButtonActive]} onPress={() => onStartTimer(60)}>
          <Text style={styles.timeButtonTextActive}>1 h</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.timeButton} onPress={() => onStartTimer(120)}>
          <Text style={styles.timeButtonText}>2 h</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.customTimerRow}>
        <TextInput
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={onChangeCustomTimerMinutes}
          placeholder="Minuten"
          placeholderTextColor="#777589"
          style={styles.timerInput}
          value={customTimerMinutes}
        />
        <TouchableOpacity style={styles.customTimerButton} onPress={onStartCustomTimer}>
          <Text style={styles.customTimerButtonText}>Benutzerdefiniert starten</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
