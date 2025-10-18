import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to</Text>
      <Text style={styles.appName}>ClimaShield</Text>

      <Image
        source={require("../assets/CoronavirusProtection.png")}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => navigation.navigate("SignUp")}
        >
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center", 
  paddingTop: 20
  },
  welcomeText: {
    fontSize: 22,
    color: "#5A3E8C",
    fontWeight: "600",
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#5A3E8C",
    marginBottom: 30,
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
  buttonContainer: {
    width: "80%",
  },
  signUpButton: {
    backgroundColor: "#4B0082",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  signUpText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    borderWidth: 2,
    borderColor: "#4B0082",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  loginText: {
    color: "#4B0082",
    fontSize: 16,
    fontWeight: "600",
  },
});
