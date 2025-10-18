import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from "react-native";

export default function LoadingScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Home"); // Navigate to HomeScreen after 2s
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* App Name */}
      <Text style={styles.title}>ClimaShield</Text>

      {/* Circular Loading Indicator */}
      <ActivityIndicator
        size="large"
        color="#FFFFFF"
        style={{ marginTop: 30 }}
      />

      {/* Subtitle */}
      <Text style={styles.subtitle}>Protecting you from climate risks...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4B0082",
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
