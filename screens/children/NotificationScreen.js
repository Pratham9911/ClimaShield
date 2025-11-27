import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export default function NotificationScreen() {
  const [expoPushToken, setExpoPushToken] = useState("");

  useEffect(() => {
    registerForNotifications();
  }, []);

  const registerForNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Push notifications permission denied");
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);
      console.log("Expo Push Token:", token);
    } else {
      alert("Must use physical device for notifications");
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  };

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 ClimaShield Alert",
        body: "Test notification has arrived!",
      },
      trigger: { seconds: 1 },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notifications Test</Text>
      <Button title="Send Test Notification" onPress={sendNotification} />
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
    marginBottom: 15,
  },
});
