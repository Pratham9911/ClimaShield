// components/ToggleButton.js
import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";

export default function ToggleButton({ active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.wrapper, active && styles.active]}>
      <Text style={[styles.text, active && styles.activeText]}>
        {active ? "Show HRI" : "Show Disasters"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#eee",
    alignSelf: "center",
    marginVertical: 10,
  },
  active: {
    backgroundColor: "#333",
  },
  text: {
    color: "#444",
    fontSize: 13,
    fontWeight: "600",
  },
  activeText: {
    color: "#fff",
  },
});
