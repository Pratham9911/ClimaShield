import React, { useState, useRef } from "react";
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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // ---- Custom Toast ----
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg) => {
    setToastMsg(msg);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 2000);
    });
  };
  // -------------------------

  const handleLogin = async () => {
    let newErrors = {};

    if (!email.trim()) newErrors.email = "Please enter your email";
    if (!password.trim()) newErrors.password = "Please enter your password";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    } else {
      setErrors({});
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace("OnboardingScreen");
    } catch (error) {
      if (error.code === "auth/invalid-email") {
        showToast("Invalid email format");
      } else if (error.code === "auth/user-not-found") {
        showToast("No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        showToast("Incorrect password");
      } else if (error.code === "auth/invalid-credential") {
        showToast("Invalid email or password");
      } else if (error.code === "auth/network-request-failed") {
        showToast("Network error. Check internet connection");
      } else {
        showToast(error.message);
      }
    }
  };

  return (
    <>
      {/* 🔥 Custom Toast */}
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
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.login}>Login</Text>

            <Image
              source={require("../assets/loginImage.png")}
              style={styles.image}
              resizeMode="contain"
            />

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

            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.noAccount}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                <Text style={styles.signupText}>Sign Up</Text>
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

  forgotContainer: {
    width: "80%",
    alignItems: "flex-end",
    marginTop: 5,
  },

  forgotText: {
    color: "#5A3E8C",
    fontSize: 13,
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

  /* Toast */
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
