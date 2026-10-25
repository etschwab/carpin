import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { TIMER_REMINDER_MINUTES } from "../constants/appConstants";

const ANDROID_CHANNEL_ID = "parking-timer";

// Mitteilungen / Anzeige im Vordergrund
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });
}

export function cancelTimerReminders() {
  return Notifications.cancelAllScheduledNotificationsAsync();
}

async function ensureNotificationPermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Parking timer",
      importance: Notifications.AndroidImportance.HIGH
    });
  }

  const permissionStatus = await Notifications.getPermissionsAsync();
  if (permissionStatus.status === "granted") {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();
  return requestedPermission.status === "granted";
}

function scheduleAt(date: Date, title: string, body: string) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {})
    }
  });
}

// Timer / Reminder / Erinnerungen vor und beim Ablauf planen
// Gibt false zurueck, wenn Mitteilungen nicht erlaubt sind.
export async function scheduleTimerReminders(endDate: Date, vehicleLabel: string, locationLabel: string) {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return false;
  }

  const endTimestamp = endDate.getTime();

  for (const reminderMinute of TIMER_REMINDER_MINUTES) {
    const triggerDate = new Date(endTimestamp - reminderMinute * 60 * 1000);
    if (triggerDate.getTime() <= Date.now()) {
      continue;
    }

    await scheduleAt(triggerDate, "Parktimer endet bald", `${vehicleLabel} steht noch ${reminderMinute} Minuten bei ${locationLabel}.`);
  }

  await scheduleAt(endDate, "Parkzeit abgelaufen", `${vehicleLabel} steht noch bei ${locationLabel}.`);
  return true;
}
