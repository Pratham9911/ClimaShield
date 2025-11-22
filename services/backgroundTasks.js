// services/backgroundTasks.js

import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchPredictions } from "./api"; // adjust if needed

const TASK_NAME = "CLIMA_BACKGROUND_TASK";

// 🔥 DEFINE WHAT TASK DOES WHEN OS TRIGGERS IT
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    console.log("🔁 Background fetch running...");

    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      ({ status } = await Location.requestForegroundPermissionsAsync());
      if (status !== "granted") return BackgroundFetch.Result.Failed;
    }

    const loc = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = loc.coords;

    const api = await fetchPredictions(latitude, longitude);
    if (!api) return BackgroundFetch.Result.NoData;

    await AsyncStorage.setItem("clima_environment", JSON.stringify(api.environment));
    await AsyncStorage.setItem("clima_predictions", JSON.stringify(api.predictions));

    console.log("✅ BG Updated:", new Date().toLocaleTimeString());

    return BackgroundFetch.Result.NewData;
  } catch (err) {
    console.log("❌ BG task error:", err);
    return BackgroundFetch.Result.Failed;
  }
});

// 🔧 REGISTER BACKGROUND TASK
export async function registerClimaBackgroundTask() {
  try {
    const status = await BackgroundFetch.getStatusAsync();

    console.log("BackgroundFetch Status:", status);

    if (status === BackgroundFetch.Status.Restricted || status === BackgroundFetch.Status.Denied) {
      console.log("⚠️ Background fetch not available");
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 5 * 60, // 5 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("✅ Background task registered");
    } else {
      console.log(" Background task already registered");
    }
  } catch (err) {
    console.log("❌ Failed to register task:", err);
  }
}
