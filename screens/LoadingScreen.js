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
import { LinearGradient } from 'expo-linear-gradient';

export default function LoadingScreen({ navigation }) {
  useEffect(() => {
  const timer = setTimeout(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    });

    return unsubscribe;
  }, 2000); // <-- Minimum time in ms

  return () => clearTimeout(timer);
}, []);

  return (
    <LinearGradient // Use LinearGradient as the container
      colors={['#87CEEB', '#90EE90']} // Top to bottom gradient (light blue to light green)
      style={styles.container}
      start={{ x: 0, y: 0 }} // Start the gradient from top-left
      end={{ x: 1, y: 1 }}   // End the gradient at bottom-right (for a diagonal effect)
    >
      <Image
        source={require("../assets/logo.png")} // Make sure you have your icon saved as logo.png
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>ClimaShield</Text>

      <ActivityIndicator
        size="large"
        color="#FFFFFF"
        style={{ marginTop: 30 }}
      />

      <Text style={styles.subtitle}>
        Protecting you from climate risks...
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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