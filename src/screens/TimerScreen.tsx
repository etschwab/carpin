import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import { styles } from "../styles/appStyles";
import type { ParkingSpot } from "../types/parking";
import { formatCountdown, formatTime, parseMinutes } from "../utils/time";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CustomTimerMode = "duration" | "until";

type TimerScreenProps = {
  activeTimerMinutes: number | null;
  customTimerMinutes: string;
  onChangeCustomTimerMinutes: (value: string) => void;
  onStartTimer: (minutes: number) => void;
  onStartTimerUntil: (endDate: Date) => void;
  parkingSpot: ParkingSpot | null;
  remainingMs: number;
  timerEnd: string | null;
  timerIsActive: boolean;
  timerSpotMatchesActiveSpot: boolean;
  timerStartedAt: string | null;
};

// Timer / Zeit Eingabe / Minuten oder Uhrzeit
function formatTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function TimerScreen({
  activeTimerMinutes,
  customTimerMinutes,
  onChangeCustomTimerMinutes,
  onStartTimer,
  onStartTimerUntil,
  parkingSpot,
  remainingMs,
  timerEnd,
  timerIsActive,
  timerSpotMatchesActiveSpot,
  timerStartedAt
}: TimerScreenProps) {
  // Timer / Ring Werte / Kreis Progress
  const ringSize = 236;
  const strokeWidth = 14;
  const ringRadius = (ringSize - strokeWidth) / 2;
  const ringCenter = ringSize / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const animatedDashOffset = useRef(new Animated.Value(ringCircumference)).current;
  const [isCustomModalVisible, setIsCustomModalVisible] = useState(false);
  const [customMode, setCustomMode] = useState<CustomTimerMode>("duration");
  const [untilTime, setUntilTime] = useState(() => formatTimeInput(new Date(Date.now() + 60 * 60 * 1000)));
  // Timer / Schnellwahl / Parkdauer Presets
  const presets = useMemo(
    () => [
      { label: "30 min", minutes: 30 },
      { label: "1 h", minutes: 60 },
      { label: "2 h", minutes: 120 }
    ],
    []
  );
  // Timer / Ring Fortschritt / Countdown Progress
  const timerProgress = useMemo(() => {
    if (!timerIsActive || !timerStartedAt || !timerEnd) {
      return 0;
    }

    const startedAtMs = new Date(timerStartedAt).getTime();
    const endsAtMs = new Date(timerEnd).getTime();
    const totalMs = endsAtMs - startedAtMs;

    if (!Number.isFinite(totalMs) || totalMs <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(1, remainingMs / totalMs));
  }, [remainingMs, timerEnd, timerIsActive, timerStartedAt]);
  const progressDashOffset = ringCircumference * (1 - timerProgress);

  // Timer / Ring Animation / Kreis bewegt sich
  useEffect(() => {
    Animated.timing(animatedDashOffset, {
      toValue: progressDashOffset,
      duration: timerIsActive ? 900 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [animatedDashOffset, progressDashOffset, timerIsActive]);

  // Timer / Popup oeffnen / Dauer oder Endzeit
  function openCustomTimerModal(mode: CustomTimerMode = timerIsActive ? "until" : "duration") {
    const suggestedEndDate = timerEnd ? new Date(timerEnd) : new Date(Date.now() + 60 * 60 * 1000);
    setUntilTime(formatTimeInput(suggestedEndDate));
    setCustomMode(mode);
    setIsCustomModalVisible(true);
  }

  // Timer / Dauer / Minuten starten
  function startDurationTimer() {
    const minutes = parseMinutes(customTimerMinutes);
    if (!minutes) {
      Alert.alert("Ungültige Zeit", "Gib eine Parkdauer in Minuten ein.");
      return;
    }

    setIsCustomModalVisible(false);
    onStartTimer(minutes);
  }

  // Timer / Bis Uhrzeit / Endzeit starten
  function startUntilTimer() {
    const normalizedTime = untilTime.trim();
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(normalizedTime);

    if (!match) {
      Alert.alert("Ungültige Uhrzeit", "Gib die Zeit im Format HH:MM ein.");
      return;
    }

    const endDate = new Date();
    endDate.setHours(Number(match[1]), Number(match[2]), 0, 0);

    if (endDate.getTime() <= Date.now()) {
      Alert.alert("Zeitpunkt vorbei", "Wähle eine Uhrzeit, die noch vor dir liegt.");
      return;
    }

    setIsCustomModalVisible(false);
    onStartTimerUntil(endDate);
  }

  // Timer / OK / Eingabe speichern
  function submitCustomTimer() {
    if (customMode === "duration") {
      startDurationTimer();
      return;
    }

    startUntilTimer();
  }

  // Timer / UI / Ring / Presets / Popup
  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 112 : 0}
        style={styles.timerKeyboardView}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.timerContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.timerHero}>
            <View style={styles.timerRing}>
              <Svg height={ringSize} style={styles.timerRingSvg} width={ringSize}>
                <Circle
                  cx={ringCenter}
                  cy={ringCenter}
                  fill="transparent"
                  r={ringRadius}
                  stroke="#232335"
                  strokeWidth={strokeWidth}
                />
                <AnimatedCircle
                  cx={ringCenter}
                  cy={ringCenter}
                  fill="transparent"
                  origin={`${ringCenter}, ${ringCenter}`}
                  r={ringRadius}
                  rotation="-90"
                  stroke={timerIsActive ? "#20c8f4" : "#3b3b4f"}
                  strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                  strokeDashoffset={animatedDashOffset}
                  strokeLinecap="round"
                  strokeWidth={strokeWidth}
                />
              </Svg>
              <View style={styles.timerRingCenter}>
                <Text style={styles.timerLabel}>Verbleibend</Text>
                <Text style={styles.timerValue}>{timerIsActive ? formatCountdown(remainingMs) : "0:00:00"}</Text>
                <Text style={styles.timerUnit}>
                  {timerIsActive && timerEnd ? `bis ${formatTime(timerEnd)}` : "Timer bereit"}
                </Text>
              </View>
            </View>
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
            {presets.map((preset) => {
              const isActivePreset = timerIsActive && activeTimerMinutes === preset.minutes;
              return (
                <TouchableOpacity
                  key={preset.minutes}
                  style={[styles.timeButton, isActivePreset && styles.timeButtonActive]}
                  onPress={() => onStartTimer(preset.minutes)}
                >
                  <Text style={isActivePreset ? styles.timeButtonTextActive : styles.timeButtonText}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.customTimerOpenButton} onPress={() => openCustomTimerModal()}>
            <View style={styles.customTimerOpenTextWrap}>
              <Text style={styles.customTimerOpenLabel}>{timerIsActive ? "Timer bearbeiten" : "Benutzerdefiniert"}</Text>
              <Text style={styles.customTimerOpenMeta}>Dauer einstellen oder bis zu einer Uhrzeit parken</Text>
            </View>
            <Text style={styles.customTimerOpenIcon}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Timer Popup */}
      <Modal
        animationType="slide"
        onRequestClose={() => setIsCustomModalVisible(false)}
        transparent
        visible={isCustomModalVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.customTimerModalBackdrop}
        >
          <View style={styles.customTimerModal}>
            <View style={styles.customTimerModalHeader}>
              <View>
                <Text style={styles.customTimerModalTitle}>
                  {timerIsActive ? "Timer bearbeiten" : "Benutzerdefinierter Timer"}
                </Text>
                <Text style={styles.customTimerModalMeta}>Lege fest, wie lange dein Parking gültig ist.</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsCustomModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timerModeTabs}>
              <TouchableOpacity
                style={[styles.timerModeTab, customMode === "duration" && styles.timerModeTabActive]}
                onPress={() => setCustomMode("duration")}
              >
                <Text style={customMode === "duration" ? styles.timerModeTabTextActive : styles.timerModeTabText}>
                  Dauer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerModeTab, customMode === "until" && styles.timerModeTabActive]}
                onPress={() => setCustomMode("until")}
              >
                <Text style={customMode === "until" ? styles.timerModeTabTextActive : styles.timerModeTabText}>
                  Bis Uhrzeit
                </Text>
              </TouchableOpacity>
            </View>

            {customMode === "duration" ? (
              <View style={styles.customTimerFieldGroup}>
                <Text style={styles.customTimerFieldLabel}>Parkdauer in Minuten</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={4}
                  onChangeText={onChangeCustomTimerMinutes}
                  placeholder="90"
                  placeholderTextColor="#777589"
                  returnKeyType="done"
                  style={styles.customTimerModalInput}
                  value={customTimerMinutes}
                />
              </View>
            ) : (
              <View style={styles.customTimerFieldGroup}>
                <Text style={styles.customTimerFieldLabel}>Parken erlaubt bis</Text>
                <TextInput
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  onChangeText={setUntilTime}
                  placeholder="18:30"
                  placeholderTextColor="#777589"
                  returnKeyType="done"
                  style={styles.customTimerModalInput}
                  value={untilTime}
                />
              </View>
            )}

            <TouchableOpacity style={styles.customTimerSubmitButton} onPress={submitCustomTimer}>
              <Text style={styles.customTimerSubmitButtonText}>Timer speichern</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
