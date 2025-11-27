import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Circle, Line } from "react-native-svg";
import PersonalSuggestionBox from "../components/PersonalSuggestionBox";

import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const intensityColors = {
  1: "#27a35bff",
  2: "#937c22ff",
  3: "#EF4444",
};

export default function PersonalScreen() {
  const [userData, setUserData] = useState(null);
  const [topDisaster, setTopDisaster] = useState(null);
  const [predictedDiseases, setPredictedDiseases] = useState({});
  const [env, setEnv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const loadAll = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setUserData(snap.data());
      }

      const todayStore = await AsyncStorage.getItem("clima_today");
      if (todayStore) {
        const parsed = JSON.parse(todayStore);
        setPredictedDiseases(parsed.disease_predictions || {});
        setEnv(parsed.environment);
      }

      const storedTop = await AsyncStorage.getItem("clima_topDisasters");
      if (storedTop) {
        const arr = JSON.parse(storedTop);
        if (arr && arr.length > 0) setTopDisaster(arr[0]);
      }

      setLoading(false);
    };

    loadAll();
  }, []);

  const safeDisaster = topDisaster || {
    name: "No Risk Detected",
    today: 0,
  };

  let percent = Number(safeDisaster.today?.toFixed(1)) || 0;
  percent = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const stepTime = 20;
    const step = (percent / duration) * stepTime;

    const interval = setInterval(() => {
      start += step;
      if (start >= percent) {
        start = percent;
        clearInterval(interval);
      }
      setAnimatedPercent(start);
    }, stepTime);

    return () => clearInterval(interval);
  }, [percent]);

  if (loading || !userData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  const disasterName = safeDisaster.name.replace(/_/g, " ");
  let intensityLevel = percent > 60 ? 3 : percent > 40 ? 2 : 1;
  const arcColor = intensityColors[intensityLevel];
  const riskLabel = intensityLevel === 3 ? "High Risk" : intensityLevel === 2 ? "Moderate Risk" : "Low Risk";

  const radius = 120;
  const strokeWidth = 18;
  const cx = 150;
  const cy = 150;

  const fullHalfArc = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${
    cx + radius
  } ${cy}`;

  const theta = Math.PI + (animatedPercent / 100) * Math.PI;
  const endX = cx + radius * Math.cos(theta);
  const endY = cy + radius * Math.sin(theta);

  const needleRadius = radius - 30;
  const needleX = cx + needleRadius * Math.cos(theta);
  const needleY = cy + needleRadius * Math.sin(theta);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.welcomeTitle}>Hi, {userData.name}!</Text>
      <Text style={styles.subWelcome}>Welcome Back</Text>

      {/* SPEEDOMETER VIEW */}
      <View style={styles.speedometer}>
        <Svg height="200" width="300">
          <Path
            d={fullHalfArc}
            stroke="#D4D4D4"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />

          {animatedPercent > 0 && (
            <Path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
              stroke={arcColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          )}

          <Circle cx={cx} cy={cy} r="5" fill={arcColor} />

          <Line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#460088ff"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </Svg>

        <Text style={styles.percent}>{animatedPercent.toFixed(0)}%</Text>
        <Text style={[styles.risk, { color: arcColor }]}>
          {disasterName} ({riskLabel})
        </Text>
        <Text style={styles.locationLine}>🔴 {env?.place_name}</Text>
      </View>

      <Text style={styles.sectionTitle}>📢 Advisory & Updates</Text>

      <PersonalSuggestionBox
        userData={userData}
        predictedDiseases={predictedDiseases}
        topDisaster={safeDisaster}
      />

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: "#fff",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#4B0082",
    textAlign: "center",
  },
  subWelcome: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4B0082",
    textAlign: "center",
    marginBottom: 16,
  },
  speedometer: { alignItems: "center",  },
  percent: { fontSize: 50, fontWeight: "900", color: "#000", marginTop: -20 , paddingLeft:20},
  risk: { fontSize: 19, fontWeight: "600", marginTop: 2 },
  locationLine: {
    fontSize: 17,
    fontWeight: "600",
    color: "#56428F",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B0082",
    marginVertical: 16,
  },
});
