// RegisterScreen.js - Allows new users to create an account by entering a username and password. It includes input validation, error handling for registration failures, and a link to navigate back to the LoginScreen for existing users. Upon successful registration, it automatically logs the user in and navigates to the main app screens.
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { AuthContext } from "../context/AuthContext";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

const BASE_URL = "https://sentiment-aware-journaling-backend.onrender.com";

export default function RegisterScreen({ navigation }) {
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !password) return;

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      // console.log("Response status:", response.status); useful for debugging
      // console.log("Response data:", data);
      if (!response.ok) {
        Alert.alert("Registration Failed", data.detail || "Unable to register.");
        setLoading(false);
        return;
      }

      await login(data.access, data.refresh);

      // AuthContext will switch stack automatically

    } catch (error) {
    // console.log("Full error:", error); useful for debugging
    Alert.alert("Error", error.message || "Unable to connect to server.");
    setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={[typography.title, styles.title]}>
          Create Account
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!username || !password || loading) && styles.disabled,
          ]}
          onPress={handleRegister}
          disabled={!username || !password || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
        activeOpacity={0.7}
      >
        <Text style={[typography.caption, styles.link]}>
          Already have an account?
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.textPrimary,
    ...elevation.card,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  link: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});