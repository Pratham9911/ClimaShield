import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";


// Import screens
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import LoadingScreen from "./screens/LoadingScreen";
import OnboardingScreen from "./screens/OnboardingScreen"; // <-- ADD THIS
import DashboardContainer from "./screens/DashboardContainer";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#4B0082"
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


          <Stack.Screen
            name="OnboardingScreen"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen name="Dashboard" component={DashboardContainer} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
