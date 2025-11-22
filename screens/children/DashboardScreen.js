import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { fetchPredictions } from "../../services/api";

export default function DashboardScreen() {
  const [env, setEnv] = useState(null);
  const [disasters, setDisasters] = useState(null);
  const [diseases, setDiseases] = useState(null);

  const refreshInterval = useRef(null);

  useEffect(() => {
    loadInitialData();
    startAutoRefresh();

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const envStore = await AsyncStorage.getItem("clima_environment");
      const disStore = await AsyncStorage.getItem("clima_disasters");
      const dis2Store = await AsyncStorage.getItem("clima_diseases");

      if (envStore) setEnv(JSON.parse(envStore));
      if (disStore) setDisasters(JSON.parse(disStore));
      if (dis2Store) setDiseases(JSON.parse(dis2Store));

      refreshData();
    } catch (err) {
      console.log("Load error:", err);
    }
  };

  const startAutoRefresh = () => {
    refreshInterval.current = setInterval(refreshData, 5 * 60 * 1000);
  };

  const refreshData = async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        ({ status } = await Location.requestForegroundPermissionsAsync());
        if (status !== "granted") return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;

      // 🔥 BACKEND CALL
      const api = await fetchPredictions(lat, lon);
      if (!api) return;

      // Expected backend:
      // {
      //   environment: {...},
      //   disaster_predictions: {...},
      //   disease_predictions: {...}
      // }

      await AsyncStorage.setItem(
        "clima_environment",
        JSON.stringify(api.environment)
      );
      await AsyncStorage.setItem(
        "clima_disasters",
        JSON.stringify(api.disaster_predictions)
      );
      await AsyncStorage.setItem(
        "clima_diseases",
        JSON.stringify(api.disease_predictions)
      );

      setEnv(api.environment);
      setDisasters(api.disaster_predictions);
      setDiseases(api.disease_predictions);
    } catch (err) {
      console.log("Refresh error:", err);
    }
  };

  if (!env || !disasters || !diseases) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 📍 Location + Temp */}
      <View style={styles.card}>
        <Text style={styles.title}>{env.place_name}</Text>
        <Text style={styles.bigValue}>{env.temp}°C</Text>
        <Text style={styles.smallValue}>Humidity: {env.humidity}%</Text>
      </View>

      {/* 🌤️ Important Weather Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weather</Text>
        <Text style={styles.row}>Rain (24h): {env.rainfall_24h} mm</Text>
        <Text style={styles.row}>Pressure: {env.pressure} hPa</Text>
        <Text style={styles.row}>Wind: {env.wind_speed} km/h</Text>
      </View>

      {/* 🌫️ Air Quality */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Air Quality</Text>
        <Text style={styles.row}>PM₂.₅: {env.pm25}</Text>
        <Text style={styles.row}>PM₁₀: {env.pm10}</Text>
        <Text style={styles.row}>AQI: {env.aqi}</Text>
      </View>

      {/* ⚠️ Disaster Risks */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Disaster Risk</Text>
        {Object.entries(disasters).map(([key, val]) => (
          <Text key={key} style={styles.row}>
            {key}: {val.toFixed(2)}%
          </Text>
        ))}
      </View>

      {/* 🏥 Disease Risks */}
      <View style={styles.card}>
  <Text style={styles.cardTitle}>Health Impact (Diseases)</Text>

  {Object.keys(diseases).length === 0 ? (
    <Text style={styles.row}>No major health risks detected 🎉</Text>
  ) : (
    Object.entries(diseases).map(([key, val]) => (
      <Text key={key} style={styles.row}>
        {key.replace(/_/g, " ")}: {val}
      </Text>
    ))
  )}
</View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#F2F7FF",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  bigValue: {
    fontSize: 40,
    fontWeight: "900",
    marginVertical: 8,
  },
  smallValue: {
    fontSize: 16,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  row: {
    fontSize: 16,
    marginBottom: 4,
  },
});
