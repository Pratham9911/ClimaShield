import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

// Screens
import DashboardScreen from "./children/DashboardScreen";
import PersonalScreen from "./children/PersonalScreen";
import NotificationScreen from "./children/NotificationScreen";
import SettingsScreen from "./children/SettingsScreen";

export default function DashboardContainer() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardScreen />;
      case "personal":
        return <PersonalScreen />;
      case "notifications":
        return <NotificationScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Dynamic Children */}
        <View style={styles.childContainer}>{renderScreen()}</View>

        {/* Full Flat Bottom Navigation */}
        <View style={styles.bottomNav}>
          <NavItem
            icon="home"
            active={activeTab === "dashboard"}
            onPress={() => setActiveTab("dashboard")}
          />
          <NavItem
            icon="person"
            active={activeTab === "personal"}
            onPress={() => setActiveTab("personal")}
          />
          <NavItem
            icon="notifications"
            active={activeTab === "notifications"}
            onPress={() => setActiveTab("notifications")}
          />
          <NavItem
            icon="settings"
            active={activeTab === "settings"}
            onPress={() => setActiveTab("settings")}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

// ICON BUTTON
function NavItem({ icon, active, onPress }) {
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}

        size={28}
        color={active ? "#4B0082" : "#A095C1"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  childContainer: {
    flex: 1,
  },

  // FLAT, FULL-WIDTH NAV BAR
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingTop: 10,
    paddingBottom: Platform.OS === "android" ? 5 : 8,

    // No border radius
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",

    // No shadows
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
});
