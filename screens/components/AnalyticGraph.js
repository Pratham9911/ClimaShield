import React, { useState , useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;

const intensityColors = {
  1: "#27a35bff", 
  2: "#937c22ff",
  3: "#EF4444",
};

function getIntensityLevel(hri) {
  if (hri > 60) return 3;
  if (hri > 40) return 2;
  return 1;
}

export default function AnalyticGraph({ nextDays, onIntensityChange, onTopDisastersChange }) {
  if (!nextDays || nextDays.length === 0) return null;

  // Reorder so graph starts at today
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const startIndex = nextDays.findIndex((d) => d.day === todayName);
  const ordered =
    startIndex === -1
      ? nextDays
      : [...nextDays.slice(startIndex), ...nextDays.slice(0, startIndex)];

  // Parse numeric values (your custom increasing test values kept untouched)
  let n = 1;
  const data = ordered.map((d) => {
    const raw = d.HRI ?? 0;
    const v = typeof raw === "number" ? raw : parseFloat(raw);
    let safe = isNaN(v) ? 0 : v;

    // your testing increment kept
    

    return Math.max(0, Math.min(100, safe));
  });

  const labels = ordered.map((d) => d.day);
  const todayHRI = data[0];

  // SAFE EFFECT FOR UPDATING PARENT
useEffect(() => {

  // ---- INTENSITY ----
  let intensity = 1;
  if (todayHRI > 60) intensity = 3;
  else if (todayHRI > 40) intensity = 2;

  if (typeof onIntensityChange === "function") {
    onIntensityChange(intensity);
  }

  // ---- TOP DISASTERS ----
  const disasters = nextDays[0]?.disasters || {};

  const topDisasters = Object.entries(disasters)
    .filter(([name, value]) => value > 40)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);

  if (typeof onTopDisastersChange === "function") {
    onTopDisastersChange(topDisasters);
  }

}, [todayHRI, nextDays]);   // <= IMPORTANT DEPENDENCIES


  const chartHeight = 180;
  const graphOffsetTop = 20;
  const chartWidth = SCREEN_WIDTH;

  const step = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  // === FIX #2 — SOFT RANGE TO PREVENT HUGE SLOPES ===
  let minVal = Math.min(...data);
  let maxVal = Math.max(...data);
  const MIN_RANGE = 6; // difference <6 means nearly flat line

  if (maxVal - minVal < MIN_RANGE) {
    const pad = (MIN_RANGE - (maxVal - minVal)) / 2;
    minVal -= pad;
    maxVal += pad;
  }

  const getY = (val) => {
    if (maxVal === minVal) return chartHeight / 2 + graphOffsetTop;
    const normal = (val - minVal) / (maxVal - minVal);
    return graphOffsetTop + (chartHeight - normal * chartHeight);
  };

  // Curve building
  let path = `M 0 ${getY(data[0])}`;
  for (let i = 1; i < data.length; i++) {
    const x = i * step;
    const y = getY(data[i]);
    const px = (i - 1) * step;
    const py = getY(data[i - 1]);
    path += ` C ${px + step / 2} ${py}, ${x - step / 2} ${y}, ${x} ${y}`;
  }

  // Today color for pointer + line
  const todayIntensity = getIntensityLevel(todayHRI);
  const baseColor = intensityColors[todayIntensity];

  // Interaction
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTouching, setTouching] = useState(false);

  const selectIndex = (idx, showTooltip = true) => {
    const safeIdx = Math.max(0, Math.min(data.length - 1, idx));
    setActiveIndex(safeIdx);
    if (showTooltip) setTouching(true);
  };

  // Graph touch
  const handleTouch = (evt) => {
    const x = Math.max(0, Math.min(chartWidth, evt.nativeEvent.locationX));
    const idx = Math.round(x / step);
    selectIndex(idx, true);
  };

  const handleRelease = () => setTouching(false);

  // === FIX #1 — Prevent pointer clipping on edges ===
let rawX = activeIndex * step;

// Fix only for first and last dot (pointer only)
if (activeIndex === 0) {
  rawX = 2; // push slightly inside
}
if (activeIndex === data.length - 1) {
  rawX = chartWidth - 8; // push slightly inside
}

const dotX = rawX;

  const dotY = getY(data[activeIndex]);

  return (
    <View style={styles.container}>

      {/* Fix: HRI moved slightly higher */}
      <View style={styles.centerBox}>
        <Text style={styles.hriValue}>{todayHRI.toFixed(1)}</Text>
        <Text style={styles.hriLabel}>Health Risk Index</Text>
      </View>

      {/* GRAPH */}
      <View style={{ width: SCREEN_WIDTH, height: chartHeight + graphOffsetTop }}>
        <Svg
          width={SCREEN_WIDTH}
          height={chartHeight + graphOffsetTop}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
          onResponderRelease={handleRelease}
        >
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={baseColor} stopOpacity={0.35} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
            </LinearGradient>
          </Defs>

          <Path d={path} stroke={baseColor} strokeWidth={4} fill="none" />

          <Path
            d={`${path} L ${chartWidth} ${chartHeight + graphOffsetTop} L 0 ${chartHeight + graphOffsetTop} Z`}
            fill="url(#grad)"
          />

          <Circle cx={dotX} cy={dotY} r={8} fill={baseColor} stroke="#fff" strokeWidth={3} />
        </Svg>

        {isTouching && (
          <View
            style={[
              styles.tooltip,
              {
                left: dotX - 40,
                bottom: (chartHeight + graphOffsetTop) - dotY + 15,
              },
            ]}
          >
            <Text style={styles.tooltipText}>
              {labels[activeIndex]} {data[activeIndex].toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* DAY LABELS */}
      <View style={styles.labelsRow}>
        {labels.map((day, i) => (
          <Pressable
            key={i}
            onPress={() => selectIndex(i, true)}   // FIX: tooltip shows from label click
          >
            <Text
              style={[
                styles.dayLabel,
                i === activeIndex && styles.activeDayLabel,
              ]}
            >
              {day}
            </Text>
          </Pressable>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: "#fff",
    paddingBottom: 6,
  },

  centerBox: {
    position: "absolute",
    top: 0,   // moved higher
    left: SCREEN_WIDTH / 2 - 60,
    zIndex: 20,
    alignItems: "center",
  },

  hriValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#111",
  },

  hriLabel: {
    fontSize: 15,
    color: "#555",
    marginTop: -4,
  },

  tooltip: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#111",
    borderRadius: 12,
    zIndex: 30,
  },

  tooltipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  labelsRow: {
    flexDirection: "row",
    width: SCREEN_WIDTH,
    justifyContent: "space-evenly",
    paddingTop: 4,
  },

  dayLabel: {
    fontSize: 14,
    color: "#555",
  },

  activeDayLabel: {
    fontWeight: "800",
    color: "#000",
  },
});
