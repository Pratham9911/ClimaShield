import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // ---------- Custom Toast State ----------
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg) => {
    setToastMsg(msg);

    // Slide down + fade in
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        // Fade out + slide up
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 2000);
    });
  };
  // ----------------------------------------

  // 🚫 Prevent logged-in user from reopening signup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigation.replace("OnboardingScreen");
    });
    return unsubscribe;
  }, []);

  // 🔥 Signup function
  const handleSignUp = async () => {
    let newErrors = {};

    if (!fullName.trim()) newErrors.fullName = "Please enter your name";
    if (!email.trim()) newErrors.email = "Please enter your email";
    if (!password.trim()) newErrors.password = "Please enter your password";

    // Custom: Minimum 8 characters
    if (password && password.length < 8) {
      newErrors.password = "";
      showToast("Password must be at least 8 characters");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    } else {
      setErrors({});
    }

    setLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: fullName,
        email: email,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Account created!");
      navigation.replace("OnboardingScreen");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        showToast("Email already exists");
      } else if (error.code === "auth/invalid-email") {
        showToast("Invalid email format");
      } else if (error.code === "auth/weak-password") {
        showToast("Password is too weak");
      } else if (error.code === "auth/network-request-failed") {
        showToast("Network error. Please check your internet connection");
      } else {
        showToast(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <>
      {/* 🔥 Custom Toast UI */}
      <Animated.View
        style={[
          styles.toastContainer,
          {
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Text style={styles.welcome}>Create Account</Text>
            <Text style={styles.login}>Sign Up</Text>

            <Image
              source={require("../assets/loginImage.png")}
              style={styles.image}
              resizeMode="contain"
            />

            {/* Full Name */}
            <View
              style={[
                styles.inputBox,
                errors.fullName ? { borderColor: "red" } : {},
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#8A8A8A"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setErrors({ ...errors, fullName: "" });
                }}
              />
            </View>
            {errors.fullName ? (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            ) : null}

            {/* Email */}
            <View
              style={[
                styles.inputBox,
                errors.email ? { borderColor: "red" } : {},
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#8A8A8A"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: "" });
                }}
              />
            </View>
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}

            {/* Password */}
            <View
              style={[
                styles.inputBox,
                errors.password ? { borderColor: "red" } : {},
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#8A8A8A"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: "" });
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={22}
                  color="#8A8A8A"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            {/* Sign Up */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Creating..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Already have account */}
            <View style={styles.signupRow}>
              <Text style={styles.noAccount}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.signupText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

/* ------------------ Styles ------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingTop: 70,
  },

  welcome: {
    fontSize: 20,
    fontWeight: "600",
    color: "#5A3E8C",
  },

  login: {
    fontSize: 30,
    fontWeight: "700",
    color: "#5A3E8C",
    marginBottom: 20,
  },

  image: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },

  inputBox: {
    width: "85%",
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  input: {
    flex: 1,
    fontSize: 16,
    outlineStyle: "none",
  },

  loginButton: {
    width: "80%",
    backgroundColor: "#4B0082",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  signupRow: {
    flexDirection: "row",
    marginTop: 15,
  },

  noAccount: {
    color: "#6F6F6F",
  },

  signupText: {
    color: "#5A3E8C",
    fontWeight: "700",
  },

  errorText: {
    width: "85%",
    color: "red",
    fontSize: 13,
    marginTop: 4,
  },

  /* --- Toast Styles --- */
  toastContainer: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    zIndex: 999,
  },
  toastText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
