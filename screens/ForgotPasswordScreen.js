import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");

  // Toast state
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

  const handleReset = async () => {
    if (!email.trim()) {
      showToast("Enter your email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent!");
    } catch (error) {
      if (error.code === "auth/invalid-email") {
        showToast("Invalid email format");
      } else if (error.code === "auth/user-not-found") {
        showToast("No account found with this email");
      } else if (error.code === "auth/network-request-failed") {
        showToast("Network error. Try again");
      } else {
        showToast("Error sending reset link");
      }
    }
  };

  return (
    <>
      {/* Toast */}
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
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we will send you a reset link.
          </Text>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#8A8A8A"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Send Reset Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#5A3E8C",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: "#6F6F6F",
    textAlign: "center",
    width: "80%",
  },

  inputBox: {
    width: "85%",
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    marginTop: 25,
    justifyContent: "center",
    elevation: 2,
  },

  input: {
    fontSize: 16,
  },

  resetButton: {
    width: "80%",
    backgroundColor: "#4B0082",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },

  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  backText: {
    color: "#5A3E8C",
    fontSize: 14,
    fontWeight: "600",
  },

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
