import { useEffect, useRef } from "react";
import { Alert } from "react-native";

import { cancelTimerReminders, scheduleTimerReminders } from "../services/notifications";
import type { ParkingSpot } from "../types/parking";

type TimerNotificationOptions = {
  isHydrated: boolean;
  parkingSpot: ParkingSpot | null;
  timerEnd: string | null;
  timerSpotId: string | null;
  vehicleName: string | undefined;
};

// Timer / Reminder / Push Notifications mit dem Timer synchron halten
export function useTimerNotifications({ isHydrated, parkingSpot, timerEnd, timerSpotId, vehicleName }: TimerNotificationOptions) {
  const hasShownNotificationAlertRef = useRef(false);

  useEffect(() => {
    async function syncTimerNotifications() {
      if (!isHydrated) {
        return;
      }

      await cancelTimerReminders();

      if (!timerEnd || !parkingSpot || timerSpotId !== parkingSpot.id) {
        return;
      }

      const endDate = new Date(timerEnd);
      const endTimestamp = endDate.getTime();

      if (Number.isNaN(endTimestamp) || endTimestamp <= Date.now()) {
        return;
      }

      const vehicleLabel = vehicleName ?? "Dein Fahrzeug";
      const locationLabel = parkingSpot.address || parkingSpot.description || "deinem Parkplatz";
      const isScheduled = await scheduleTimerReminders(endDate, vehicleLabel, locationLabel);

      if (!isScheduled) {
        if (!hasShownNotificationAlertRef.current) {
          hasShownNotificationAlertRef.current = true;
          Alert.alert(
            "Mitteilungen deaktiviert",
            "Aktiviere Mitteilungen für CarPin, damit du 1 Stunde, 30 Minuten, 10 Minuten, 5 Minuten und beim Ablauf erinnert wirst."
          );
        }
        return;
      }

      hasShownNotificationAlertRef.current = false;
    }

    syncTimerNotifications().catch(() => {
      if (!hasShownNotificationAlertRef.current) {
        hasShownNotificationAlertRef.current = true;
        Alert.alert("Reminder-Fehler", "Die Timer-Erinnerungen konnten nicht eingerichtet werden.");
      }
    });
  }, [isHydrated, vehicleName, parkingSpot, timerEnd, timerSpotId]);
}
