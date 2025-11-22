// src/utils/location.js
import * as Location from "expo-location";

export async function getUserLocation() {
  try {
    // request permission
    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      return { error: "Permission denied" };
    }

    // get coords
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

  } catch (error) {
    console.log("Location Error:", error);
    return { error: "Location error" };
  }
}
