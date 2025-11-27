import {useState , useEffect , react} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

import { Ionicons } from "@expo/vector-icons";


export default function SettingsScreen({ navigation }) {

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) setUserData(snap.data());
      } catch (error) {
        console.log("Error loading user:", error);
      }
    };

    loadUser();
  }, []);
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile Section */}
      <View style={styles.profileContainer}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: "https://via.placeholder.com/120" }} // placeholder DP
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="pencil" size={18} color="#5A3EBD" />
          </TouchableOpacity>

        </View>

        <Text style={styles.userName}>
          {userData?.name || ""}
        </Text>

        <Text style={styles.email}>
          {userData?.email || ""}
        </Text>
      </View>

      {/* List Items */}
      <SettingItem
        icon="person-outline"
        title="Account"
        onPress={() => { }}
      />
      <SettingItem
        icon="notifications-outline"
        title="Notification"
        onPress={() => { }}
      />
      <SettingItem
        icon="eye-outline"
        title="Appearance"
        onPress={() => { }}
      />
      <SettingItem
        icon="shield-checkmark-outline"
        title="Privacy & Security"
        onPress={() => { }}
      />
      <SettingItem
        icon="volume-high-outline"
        title="Sound"
        onPress={() => { }}
      />
      <SettingItem
        icon="globe-outline"
        title="Language"
        onPress={() => { }}
      />

      {/* Change Location Option */}
      <SettingItem
        icon="location-outline"
        title="Change Location"
        onPress={() => navigation.navigate("SelectLocation")}
      />
    </ScrollView>
  );
}

// Reusable Row Component
const SettingItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={22} color="#6A5ACD" />
      <Text style={styles.rowText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color="#6A5ACD" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#4E3AA8",
  },

  profileContainer: {
    alignItems: "center",
    marginVertical: 25,
  },

  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    width: 32,
    height: 32,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4E3798",
    marginTop: 10,
  },

  email: {
    fontSize: 14,
    color: "#777",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowText: {
    fontSize: 17,
    fontWeight: "500",
    marginLeft: 12,
    color: "#4E3798",
  },
});
