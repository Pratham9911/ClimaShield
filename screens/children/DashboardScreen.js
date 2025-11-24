import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { fetchPredictions } from "../../services/api";
import AnalyticGraph from "../components/AnalyticGraph";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardScreen({ user }) {
  const [env, setEnv] = useState(null);
  const [disasters, setDisasters] = useState(null);
  const [diseases, setDiseases] = useState(null);
  const [nextDays, setNextDays] = useState([]);
 const [intensity, setIntensity] = useState(1); 
 const [topDisasters, setTopDisasters] = useState([]);
  const refreshInterval = useRef(null);

  const intensityColors = {
  1: "#27a35bff",
  2: "#937c22ff",
  3: "#EF4444",
};


    const handleIntensityChange = (value) => {
    setIntensity(value); // 1–5
  };
  
  useEffect(() => {
    loadInitialData();
    startAutoRefresh();

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const todayStore = await AsyncStorage.getItem("clima_today");
      const nextStore = await AsyncStorage.getItem("clima_next7days");

      if (todayStore) {
        const parsed = JSON.parse(todayStore);
        setEnv(parsed.environment);
        setDisasters(parsed.disaster_predictions);
        setDiseases(parsed.disease_predictions);
      }

      if (nextStore) setNextDays(JSON.parse(nextStore));

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
     const customLoc = {
  lat: 28.376463793601037,
  lon: 77.28688295502985
};

// const loc = await getUserLocation(customLoc);
// console.log(loc);
//       const lat = loc.latitude;
//       const lon = loc.longitude;

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;

      const api = await fetchPredictions(lat, lon);
      if (!api) return;

      const todayData = api.today;
      const nextData = api.next7days || [];

      await AsyncStorage.setItem("clima_today", JSON.stringify(todayData));
      await AsyncStorage.setItem("clima_next7days", JSON.stringify(nextData));

      setEnv(todayData.environment);
      setDisasters(todayData.disaster_predictions);
      setDiseases(todayData.disease_predictions);
      setNextDays(nextData);
    } catch (err) {
      console.log("Refresh error:", err);
    }
  };

  if (!env) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Format date like Figma: Sep 1, 2025
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      {/* <View style={styles.headerRow}>

        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </Text>
        </View>

        <View >
          <Ionicons name="notifications"  size={28} color="#c25353ff" />
        </View>

      </View> */}


      {/* Today */}
      <Text style={styles.todayText}>Today</Text>

      {/* Date */}
      <Text style={styles.dateText}>{formattedDate}</Text>

      {/* Heat Alert Banner */}
      <View style={styles.alertBox}>

        <Text style={styles.alertText}>2 High Heat Alerts</Text>
      </View>

      {/* Tabs */}


      {/* Location */}

     <View style={styles.locationRow}>
  <View style={[styles.redDot, { backgroundColor: intensityColors[intensity] }]} />
  <Text style={[styles.locationText, { color: intensityColors[intensity] }]}>
    {env?.place_name || "Your Location"}
  </Text>
</View>

 <Text style={{ color: intensityColors[intensity] }}>
        Current Intensity: {intensity}
      </Text>
      {/* Placeholder Graph (Full width) */}
       <View>
      <AnalyticGraph 
        nextDays={nextDays}
        onIntensityChange={handleIntensityChange}
          onTopDisastersChange={setTopDisasters}
      />
      </View>


      {/* Live Updates */}
      <View style={styles.liveContainer}>
        <View style={styles.liveTitleRow}>
          <View style={styles.purpleDot} />
          <Text style={styles.liveTitle}>Live Updates & Suggestions</Text>
        </View>

        <Text style={styles.liveDesc}>
          Heatwave alert in Delhi – High.{"\n"}
          Stay hydrated – Heat index is rising and avoid{" "}
          outdoor exposure – AQI is poor.
        </Text>
      </View>

      {/* Bottom Scroll Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 20 }}
      >
        <View style={styles.bottomTile}>
          <Ionicons name="map-outline" size={26} color="#E84A4A" />
          <Text style={styles.tileText}>View Safe Zones</Text>
        </View>

        <View style={styles.bottomTile}>
          <Ionicons name="bed-outline" size={26} color="#E84A4A" />
          <Text style={styles.tileText}>Hospital Capacity</Text>
        </View>

        <View style={styles.bottomTile}>
          <Ionicons name="call-outline" size={26} color="#E84A4A" />
          <Text style={styles.tileText}>Emergency</Text>
        </View>
      </ScrollView>
    </ScrollView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },

  // add padding here instead of container
  contentPadding: {
    paddingHorizontal: 20,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#aca9a8ff",
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },



  todayText: {
    marginTop: 8,
    fontSize: 16,
    color: "#777",
    paddingHorizontal: 20,
  },

  dateText: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 2,
    color: "#333",
    paddingHorizontal: 20,
  },

  alertBox: {
    flexDirection: "row",

    alignItems: "center",
    paddingVertical: 8,
    marginTop: 12,
    alignSelf: "center",



  },

  alertText: {
    marginLeft: 6,
    color: "#E84A4A",
    fontSize: 18,
    fontWeight: "400",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  redDot: {
    width: 8,
    height: 8,
    backgroundColor: "#E84A4A",
    borderRadius: 4,
    marginRight: 8,
  },

  locationText: {
    fontSize: 16,
    color: "#E84A4A",
    fontWeight: "600",
  },

  liveContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },

  liveTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  purpleDot: {
    width: 8,
    height: 8,
    backgroundColor: "#9C7BFF",
    borderRadius: 4,
    marginRight: 8,
  },

  liveTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6A4DE8",
  },

  liveDesc: {
    marginTop: 6,
    color: "#555",
    fontSize: 15,
    lineHeight: 22,
  },

  bottomTile: {
    width: 130,
    height: 120,
    backgroundColor: "#fff",
    borderRadius: 22,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  tileText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },
});

