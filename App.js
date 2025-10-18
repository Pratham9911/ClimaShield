import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, Platform } from "react-native";

// Import screens
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import LoadingScreen from "./screens/LoadingScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      {/* Set StatusBar color and content style */}
      <StatusBar
        barStyle="light-content" // use "dark-content" if your background is light
        backgroundColor="#4B0082" // same as your app theme color
      />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Loading">
          <Stack.Screen
            name="Loading"
            component={LoadingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
