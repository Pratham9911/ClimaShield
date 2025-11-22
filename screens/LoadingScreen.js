import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { fetchPredictions } from "../services/api";

const MIN_LOADING_MS = 2000;

export default function LoadingScreen({ navigation }) {
  useEffect(() => {
    let unsubscribeAuth;

    const getAndStoreClimaData = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;

        const apiResponse = await fetchPredictions(lat, lon);

        await AsyncStorage.setItem(
          "clima_environment",
          JSON.stringify(apiResponse.environment || {})
        );
        await AsyncStorage.setItem(
          "clima_predictions",
          JSON.stringify(apiResponse.predictions || {})
        );
      } catch (err) {
        console.log("Error:", err);
      }
    };

    const start = Date.now();

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const navigateAfterDelay = (screen) => {
        const elapsed = Date.now() - start;
        const remaining = MIN_LOADING_MS - elapsed;
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: screen }] });
        }, Math.max(remaining, 0));
      };

      if (!user) {
        navigateAfterDelay("Home");
      } else {
        getAndStoreClimaData(); // background
        navigateAfterDelay("Dashboard");
      }
    });

    return () => unsubscribeAuth && unsubscribeAuth();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>ClimaShield</Text>

      <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 30 }} />

      <Text style={styles.subtitle}>Protecting you from climate risks...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A08EFF", // 💜 Light purple background
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 15,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
