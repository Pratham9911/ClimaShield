import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { fetchPredictions } from "../../services/api";
import AnalyticGraph from "../components/AnalyticGraph";
import { Ionicons } from "@expo/vector-icons";
import { getUserLocation } from "../../utils/location";

import ToggleButton from "../components/ToggleButton";
import DisasterGraph from "../components/DisasterGraph";
import SuggestionBox from "../components/SuggestionBox";
export default function DashboardScreen({ navigation , route , user }) {
  const [env, setEnv] = useState(null);
  const [disasters, setDisasters] = useState(null);
  const [diseases, setDiseases] = useState(null);
  const [nextDays, setNextDays] = useState([]);
  const [intensity, setIntensity] = useState(1);
  const [topDisasters, setTopDisasters] = useState([]);
  const refreshInterval = useRef(null);
  const [showDisasterGraph, setShowDisasterGraph] = useState(false);


  const intensityColors = {
    1: "#27a35bff",
    2: "#937c22ff",
    3: "#EF4444",
  };


  const handleIntensityChange = (value) => {
    setIntensity(value); // 1–5
  };

const [blink, setBlink] = useState(true);

useEffect(() => {
  const interval = setInterval(() => {
    setBlink(prev => !prev);
  }, 500); // twice per second

  return () => clearInterval(interval);
}, []);


  useEffect(() => {
    loadInitialData();
    startAutoRefresh();

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [route?.params?.location]);

  const loadInitialData = async () => {
  try {
    const customLoc = route?.params?.location || null;

    if (customLoc) {
      // User selected a location → fetch new data directly
      await refreshData();
      return;
    }

    // Otherwise load cached data
    const todayStore = await AsyncStorage.getItem("clima_today");
    const nextStore = await AsyncStorage.getItem("clima_next7days");

    if (todayStore) {
      const parsed = JSON.parse(todayStore);
      setEnv(parsed.environment);
      setDisasters(parsed.disaster_predictions);
      setDiseases(parsed.disease_predictions);
    }

    if (nextStore) {
      setNextDays(JSON.parse(nextStore));
    }

    // After loading, refresh with actual location
    await refreshData();
  } catch (err) {
    console.log("Load error:", err);
  }
};


  const startAutoRefresh = () => {
    refreshInterval.current = setInterval(refreshData, 5 * 60 * 1000);
  };

  const refreshData = async () => {
  try {
    // 1. Get custom location if passed from Map Picker
    const customLoc = route?.params?.location || null;

    // 2. Get actual location using your location.js logic
    const loc = await getUserLocation(customLoc);

    if (loc.error) return;

    const lat = loc.latitude;
    const lon = loc.longitude;
    console.log("Using location:", lat, lon);
    // 3. Fetch predictions
    const api = await fetchPredictions(lat, lon);
    if (!api) return;

    const todayData = api.today;
    const nextData = api.next7days || [];
    
    setEnv(todayData.environment);
    setDisasters(todayData.disaster_predictions);
    setDiseases(todayData.disease_predictions);
    setNextDays(nextData);

    // Optional: store locally
    await AsyncStorage.setItem("clima_today", JSON.stringify(todayData));
    await AsyncStorage.setItem("clima_next7days", JSON.stringify(nextData));

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


      {/* Placeholder Graph (Full width) */}
      <View>
        <ToggleButton
          active={showDisasterGraph}
          onPress={() => setShowDisasterGraph(!showDisasterGraph)}
        />

        {showDisasterGraph ? (
          <DisasterGraph nextDays={nextDays}
            topDisasters={topDisasters}
            />
        ) : (
          <AnalyticGraph
            nextDays={nextDays}
            onIntensityChange={handleIntensityChange}
            onTopDisastersChange={setTopDisasters}
          />
        )}
      </View>


      {/* Live Updates */}
     <View style={styles.liveContainer}>
  <View style={styles.liveTitleRow}>
    <View
      style={[
        styles.purpleDot,
        { backgroundColor: blink ? "#9C7BFF" : "#E84A4A" } // blink purple <-> red
      ]}
    />
    <Text
      style={[
        styles.liveTitle,
        { color: blink ? "#9C7BFF" : "#E84A4A" } // also blink text color
      ]}
    >
      Live Updates & Suggestions
    </Text>
  </View>

  <SuggestionBox topDisasters={topDisasters} diseases={diseases} />
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
    marginBottom: 15,
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

