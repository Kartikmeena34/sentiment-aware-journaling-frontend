import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import JournalScreen from "../screens/JournalScreen";
import TrendScreen from "../screens/TrendScreen";
import HistoryScreen from "../screens/HistoryScreen";
import EmotionFeedbackScreen from "../screens/EmotionFeedbackScreen";

console.log("REGISTER SCREEN:", RegisterScreen);
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4A90E2",
        tabBarIcon: ({ color, size }) => {
          let icon;
          if (route.name === "Journal") icon = "book-outline";
          if (route.name === "Trends") icon = "analytics-outline";
          if (route.name === "History") icon = "time-outline";
          return <Ionicons name={icon} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Trends" component={TrendScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
  {isAuthenticated ? (
    <>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="EmotionFeedback"
        component={EmotionFeedbackScreen}
      />
    </>
  ) : (
    <>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </>
  )}
</Stack.Navigator>
  );
}