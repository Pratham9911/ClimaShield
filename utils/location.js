// src/utils/location.js
import * as Location from "expo-location";

export async function getUserLocation(customLocation = null) {
  try {
    // If custom location is passed, return it directly
    if (customLocation?.lat && customLocation?.lon) {
      return {
        latitude: customLocation.lat,
        longitude: customLocation.lon,
        isCustom: true,
      };
    }

    // request permission
    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      return { error: "Permission denied" };
    }

    // get real device location
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      isCustom: false,
    };

  } catch (error) {
    console.log("Location Error:", error);
    return { error: "Location error" };
  }
}
