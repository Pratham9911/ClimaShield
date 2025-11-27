import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";



export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState(null);
  const [age, setAge] = useState("");
  const [selectedDiseases, setSelectedDiseases] = useState([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const DISEASE_OPTIONS = [
  { key: "Asthma_exacerbation", label: "Asthma" },
  { key: "COPD_exacerbation", label: "COPD" },
  { key: "Migraine_headache", label: "Migraine" },
  { key: "Cardiac_stress_arrhythmia", label: "Heart Condition" },
  { key: "Arthritis_joint_pain_flare", label: "Arthritis" },
  { key: "Allergic_rhinitis", label: "Allergies" },
  { key: "Shortness_of_breath", label: "Breathing Issues" },
  { key: "Eye_irritation", label: "Eye Sensitivity" },
  { key: "Skin_infections_cellulitis", label: "Chronic Skin Condition" },
  { key: "Ear_infections", label: "Ear Sensitivity" },
];

  // Load existing data
  useEffect(() => {
    const loadUser = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setDob(data.dob || null);
        setSelectedDiseases(data.diseases || []);

        if (data.dob) {
          setAge(calculateAge(data.dob));
        }
      }
    };

    loadUser();
  }, []);

  // Age calculation
  const calculateAge = (date) => {
    const b = new Date(date);
    const t = new Date();
    return t.getFullYear() - b.getFullYear();
  };

  // Toggle disease tag
  const toggleDisease = (key) => {
    if (selectedDiseases.includes(key)) {
      setSelectedDiseases(selectedDiseases.filter((d) => d !== key));
    } else {
      setSelectedDiseases([...selectedDiseases, key]);
    }
  };

  // Save profile updates
  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, "users", user.uid), {
        name,
        dob,
        age: calculateAge(dob),
        diseases: selectedDiseases,
      });

      navigation.goBack();
    } catch (error) {
      console.log("Error saving profile:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {/* Name */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter full name"
        style={styles.input}
      />

      {/* DOB Picker */}
      <Text style={styles.label}>Date of Birth</Text>
      <TouchableOpacity
        style={styles.dateBox}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>
          {dob ? new Date(dob).toDateString() : "Select Date"}
        </Text>
        <Ionicons name="calendar-outline" size={22} color="#4B0082" />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dob ? new Date(dob) : new Date(2000, 0, 1)}
          mode="date"
          display="spinner"
          onChange={(event, selected) => {
            setShowDatePicker(false);
            if (selected) {
              setDob(selected.toISOString());
              setAge(calculateAge(selected.toISOString()));
            }
          }}
        />
      )}

      {/* Age Display */}
      <Text style={styles.label}>Age</Text>
      <View style={styles.ageBox}>
        <Text style={styles.ageText}>{age ? `${age} years` : "-"}</Text>
      </View>

      {/* Disease Selection */}
      <Text style={styles.label}>Select Health Conditions</Text>

      <View style={styles.chipContainer}>
        {DISEASE_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => toggleDisease(item.key)}
            style={[
              styles.chip,
              selectedDiseases.includes(item.key) && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedDiseases.includes(item.key) && styles.chipTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#4B0082",
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    marginBottom: 6,
    color: "#444",
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#F5F5F5",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },

  dateBox: {
    backgroundColor: "#F5F5F5",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  dateText: { fontSize: 16, color: "#333" },

  ageBox: {
    backgroundColor: "#EFEFEF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },

  ageText: { fontSize: 17, fontWeight: "600", color: "#4B0082" },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 25,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#E9E1FF",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 10,
  },

  chipSelected: {
    backgroundColor: "#4B0082",
  },

  chipText: {
    color: "#4B0082",
    fontWeight: "600",
  },

  chipTextSelected: {
    color: "#fff",
  },

  saveButton: {
    backgroundColor: "#4B0082",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 50,
  },

  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
