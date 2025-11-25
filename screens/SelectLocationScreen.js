import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

export default function SelectLocationScreen({ navigation }) {
  const [region, setRegion] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission denied");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const initialRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

      setRegion(initialRegion);
      setSelected({ latitude, longitude });
    })();
  }, []);

  const onConfirm = () => {
    if (!selected) return;
   navigation.navigate("Dashboard", {
  location: {
    lat: selected.latitude,
    lon: selected.longitude,
  }
});

  };

  if (!region) return <Text>Loading map...</Text>;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={(r) => {
          setSelected({ latitude: r.latitude, longitude: r.longitude });
        }}
      />

      {/* FIXED PIN ICON */}
      <View style={styles.pinContainer}>
        <Text style={{ fontSize: 40 }}>📍</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onConfirm}>
        <Text style={styles.btnText}>Use this location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: "100%",
    height: "100%",
  },
  pinContainer: {
    position: "absolute",
    top: "45%",
    left: "47%",
  },
  button: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
