// App.js - The root component of the journaling app. It sets up the navigation structure and wraps the entire app with the AuthProvider to manage user authentication state. It uses React Navigation to handle screen transitions between Login, Register, Journal, Emotion Feedback, History, and Trend screens.
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}