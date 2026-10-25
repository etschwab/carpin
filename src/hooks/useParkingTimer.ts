import { useMemo, useState } from "react";
import { Alert } from "react-native";

import type { Screen } from "../types/parking";
import { useNow } from "./useNow";
import type { PersistedAppState } from "./usePersistedAppState";

// Timer / Parkdauer / Countdown
export function useParkingTimer(appState: PersistedAppState, navigate: (screen: Screen) => void) {
  const { parkingSpot, setTimerEnd, setTimerSpotId, setTimerStartedAt, timerEnd, timerSpotId, timerStartedAt } = appState;
  const [customTimerMinutes, setCustomTimerMinutes] = useState("90");
  const now = useNow();

  // Timer / Status / Restzeit / aktiver Parkplatz
  const timerSpotMatchesActiveSpot = Boolean(parkingSpot && timerSpotId === parkingSpot.id);
  const remainingMs = timerEnd ? new Date(timerEnd).getTime() - now : 0;
  const timerIsActive = Boolean(timerEnd && remainingMs > 0);
  const activeTimerMinutes = useMemo(() => {
    if (!timerStartedAt || !timerEnd) {
      return null;
    }

    const startedAtMs = new Date(timerStartedAt).getTime();
    const endsAtMs = new Date(timerEnd).getTime();
    const totalMinutes = Math.round((endsAtMs - startedAtMs) / 60000);

    return Number.isFinite(totalMinutes) && totalMinutes > 0 ? totalMinutes : null;
  }, [timerEnd, timerStartedAt]);

  function startTimerUntil(endDate: Date) {
    if (!parkingSpot) {
      Alert.alert("Kein Parkplatz", "Speichere zuerst einen Parkplatz, damit der Timer zugeteilt werden kann.");
      navigate("dashboard");
      return;
    }

    if (endDate.getTime() <= Date.now()) {
      Alert.alert("Ungültige Zeit", "Wähle einen Zeitpunkt in der Zukunft.");
      return;
    }

    setTimerStartedAt(new Date().toISOString());
    setTimerEnd(endDate.toISOString());
    setTimerSpotId(parkingSpot.id);
    navigate("timer");
  }

  function startTimer(minutes: number) {
    startTimerUntil(new Date(Date.now() + minutes * 60 * 1000));
  }

  function stopTimer() {
    setTimerEnd(null);
    setTimerStartedAt(null);
    setTimerSpotId(null);
  }

  return {
    activeTimerMinutes,
    customTimerMinutes,
    remainingMs,
    setCustomTimerMinutes,
    startTimer,
    startTimerUntil,
    stopTimer,
    timerIsActive,
    timerSpotMatchesActiveSpot
  };
}
