// firebase.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCJhKm61fMjRYlV6t3-cRBvNeEqbjH8ZkU",
  authDomain: "climashield-a71a0.firebaseapp.com",
  projectId: "climashield-a71a0",
  storageBucket: "climashield-a71a0.firebasestorage.app",
  messagingSenderId: "474825076546",
  appId: "1:474825076546:web:62a6fcb86dd4f2a53ee2db",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let auth;

// ✔ Use native persistence for iOS/Android
if (Platform.OS !== "web") {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  // ✔ Web fallback (IndexedDB)
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
