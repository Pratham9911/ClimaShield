import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function SettingsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("SelectLocation")}
      >
        <Text style={styles.btnText}>Change Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "600",
  },

  btn: {
    marginTop: 20,
    backgroundColor: "#4B0082",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
