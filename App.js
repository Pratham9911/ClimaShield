import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});



import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";

// Import screens
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import LoadingScreen from "./screens/LoadingScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import DashboardContainer from "./screens/DashboardContainer";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import SelectLocationScreen from "./screens/SelectLocationScreen";
import EditProfileScreen from "./screens/settingComponents/EditProfileScreen";
// 🔥 IMPORT background task registration
import { registerClimaBackgroundTask } from "./services/backgroundTasks";

const Stack = createNativeStackNavigator();

export default function App() {
  // 🔧 Register background fetch when app loads
  useEffect(() => {
    registerClimaBackgroundTask();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4B0082" />

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

          <Stack.Screen
            name="Dashboard"
            component={DashboardContainer}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen name="SelectLocation" component={SelectLocationScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />


        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
