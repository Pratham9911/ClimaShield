// DisasterGraph.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Final required colors per intensity level
const DISASTER_COLORS = {
  1: ["#1e7c4a", "#145c38"],   // green family (40-50)
  2: ["#c97a2b", "#9c5c1f"],   // orange family (50-70)
  3: ["#d43d3d", "#a82f2f"],   // red family (70+)
};

// Compute intensity level from a % value
function getIntensityFromValue(val) {
  if (val > 70) return 3;
  if (val > 50) return 2;
  return 1;
}

export default function DisasterGraph({
  nextDays = [],
  topDisasters = [],
  intensity, // (kept for backward compatibility if parent passes a global intensity)
}) {
  if (!nextDays.length) return null;

  // limit to max 2 disasters
  const selected = topDisasters.slice(0, 2);

  if (!selected.length) {
    return (
      <View style={[styles.container, styles.fallbackContainer]}>
        <Text style={styles.noRiskText}>No major disaster risk found.</Text>
      </View>
    );
  }

  // Extract labels and datasets
  const labels = nextDays.map((d) => d.day);

  const datasets = selected.map((ds) => {
    const key = ds.name; // extract string name
    const values = nextDays.map((d) => d.disasters?.[key] ?? 0);
    return { key, values };
  });


  // === PER-DATASET INTENSITY (based on dataset's own values) ===
  // We'll compute a representative value (average across days) for each disaster,
  // then map that to an intensity level and choose the color shade by dataset index.
  datasets.forEach((ds, idx) => {
    const vals = ds.values || [];
    const sum = vals.reduce((s, x) => s + x, 0);
    const avg = vals.length ? sum / vals.length : 0;
    const level = getIntensityFromValue(avg);
    const family = DISASTER_COLORS[level] || DISASTER_COLORS[1];
    // index 0 -> family[0], index 1 -> family[1]
    ds.color = family[idx] || family[0];
    ds._intensityLevel = level; // optional debug
  });

  // Chart sizing (match AnalyticGraph)
  const chartHeight = 180;
  const graphOffsetTop = 20;
  const chartWidth = SCREEN_WIDTH;

  // Prevent huge slopes
  let minVal = Math.min(...datasets.flatMap((d) => d.values));
  let maxVal = Math.max(...datasets.flatMap((d) => d.values));
  const MIN_RANGE = 6;

  if (maxVal - minVal < MIN_RANGE) {
    const pad = (MIN_RANGE - (maxVal - minVal)) / 2;
    minVal -= pad;
    maxVal += pad;
  }

  const step = chartWidth / (labels.length - 1);

  const getY = (v) => {
    if (maxVal === minVal) return graphOffsetTop + chartHeight / 2;
    const t = (v - minVal) / (maxVal - minVal);
    return graphOffsetTop + (chartHeight - t * chartHeight);
  };

  const buildPath = (values) => {
    let p = `M 0 ${getY(values[0])}`;
    for (let i = 1; i < values.length; i++) {
      const x = i * step;
      const y = getY(values[i]);
      const px = (i - 1) * step;
      const py = getY(values[i - 1]);
      const c1x = px + step / 2;
      const c2x = x - step / 2;

      p += ` C ${c1x} ${py}, ${c2x} ${y}, ${x} ${y}`;
    }
    return p;
  };

  // Interaction
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTouching, setTouching] = useState(false);

  const handleTouch = (evt) => {
    const x = evt.nativeEvent.locationX;
    const idx = Math.round(x / step);
    setActiveIndex(Math.min(labels.length - 1, Math.max(0, idx)));
    setTouching(true);
  };
  const handleRelease = () => setTouching(false);

  const rawDotX = activeIndex * step;
  const DOT_MARGIN = 12;
  const dotX = Math.max(DOT_MARGIN, Math.min(chartWidth - DOT_MARGIN, rawDotX));

  const paths = datasets.map((ds) => buildPath(ds.values));
  const bottomY = chartHeight + graphOffsetTop;

  return (
    <View style={styles.container}>
      <View style={{ width: chartWidth, height: bottomY }}>
        <Svg
          width={chartWidth}
          height={bottomY}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
          onResponderRelease={handleRelease}
        >
          {/* Gradients definitions for each dataset (unique ids) */}
          <Defs>
            {datasets.map((ds, idx) => {
              const id = `grad_${idx}_${ds._intensityLevel}`;
              return (
                <LinearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  {/* strong near the line, soft fade to nearly transparent */}
                  <Stop offset="0%" stopColor={ds.color} stopOpacity="0.28" />
                  <Stop offset="100%" stopColor={ds.color} stopOpacity="0.02" />
                </LinearGradient>
              );
            })}
          </Defs>

          {/* vertical line (unchanged) */}
          {isTouching && (
            <Line
              x1={rawDotX}
              y1={graphOffsetTop - 6}
              x2={rawDotX}
              y2={bottomY}
              stroke="#888"
              strokeWidth={1}
              strokeDasharray={[5, 7]}
              opacity={0.55}
            />
          )}

          {/* Gradient fills under each line */}
          {paths.map((p, idx) => {
            const ds = datasets[idx];
            const id = `grad_${idx}_${ds._intensityLevel}`;
            return (
              <Path
                key={"fill" + idx}
                d={`${p} L ${chartWidth} ${bottomY} L 0 ${bottomY} Z`}
                fill={`url(#${id})`}
              />
            );
          })}

          {/* thin crisp lines */}
          {paths.map((p, idx) => (
            <Path
              key={"line" + idx}
              d={p}
              stroke={datasets[idx].color}
              strokeWidth={2.2}
              fill="none"
              strokeLinecap="round"
            />
          ))}

          {/* pointer dots (AnalyticGraph style) */}
          {datasets.map((ds, idx) => (
            <Circle
              key={"dot" + idx}
              cx={dotX}
              cy={getY(ds.values[activeIndex])}
              r={8}
              fill={ds.color}
              stroke="#fff"
              strokeWidth={3}
            />
          ))}
        </Svg>

        {/* tooltip */}
        {isTouching && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.max(6, Math.min(chartWidth - 110, dotX - 50)),
                bottom:
                  bottomY -
                  Math.min(...datasets.map((ds) => getY(ds.values[activeIndex]))) +
                  12,
              },
            ]}
          >
            <Text style={styles.tooltipTitle}>{labels[activeIndex]}</Text>
            {datasets.map((ds, i) => (
              <Text key={i} style={styles.tooltipText}>
                {ds.key}: {ds.values[activeIndex].toFixed(1)}%
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* labels */}
      <View style={styles.labelsRow}>
        {labels.map((d, i) => (
          <Pressable
            key={i}
            onPress={() => {
              setActiveIndex(i);
              setTouching(true);
            }}
            style={styles.labelWrap}
          >
            <Text style={[styles.dayLabel, i === activeIndex && styles.activeDayLabel]}>
              {d}
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
    paddingTop: 6,
    paddingBottom: 6,
  },
  fallbackContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  noRiskText: { color: "#444", fontSize: 15 },

  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingTop: 10,
  },
  labelWrap: { minWidth: 28, alignItems: "center" },
  dayLabel: { fontSize: 13, color: "#666" },
  activeDayLabel: { color: "#000", fontWeight: "700" },

  tooltip: {
    position: "absolute",
    minWidth: 100,
    padding: 7,
    backgroundColor: "#111",
    borderRadius: 10,
  },
  tooltipTitle: { color: "#fff", fontSize: 13, fontWeight: "700" },
  tooltipText: { color: "#ddd", fontSize: 11 },
});
