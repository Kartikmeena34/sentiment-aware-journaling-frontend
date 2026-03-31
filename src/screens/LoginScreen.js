import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import api from "../service/api";
import { AuthContext } from "../context/AuthContext";

const WARM = {
  bg: "#FDF6EC",
  surface: "#FFFDF9",
  accent: "#C17B4E",
  accentSoft: "#F5E6D3",
  textPrimary: "#2D1B0E",
  textSecondary: "#7A5C44",
  textMuted: "#B09880",
  border: "#EDE0D0",
};

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { login } = useContext(AuthContext);

  const headerSlide = useRef(new Animated.Value(-60)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerSlide, {
        toValue: 0,
        tension: 40,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(250),
        Animated.parallel([
          Animated.spring(cardSlide, {
            toValue: 0,
            tension: 40,
            friction: 12,
            useNativeDriver: true,
          }),
          Animated.timing(cardFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(450),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/login/", {
        username: username.trim(),
        password: password.trim(),
      });

      const { access, refresh, user } = response.data;
      if (!access || !refresh) throw new Error("Invalid response from server");
      await login(access, refresh, user);
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";
      if (error.response) {
        errorMessage = error.response.data?.message
          || error.response.data?.error
          || "Invalid username or password";
      } else if (error.request) {
        errorMessage = "Cannot connect to server. Check your internet connection.";
      }
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Animated header band */}
        <Animated.View
          style={[
            styles.headerBand,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <Text style={styles.appLabel}>📖 MoodScript</Text>
          <Text style={styles.headerTitle}>Welcome{"\n"}back.</Text>
          <Text style={styles.headerSubtitle}>
            Your journal has been waiting for you
          </Text>
        </Animated.View>

        {/* Animated form card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardFade,
              transform: [{ translateY: cardSlide }],
            },
          ]}
        >
          <Text style={styles.cardTitle}>Sign In</Text>

          <TextInput
            style={[
              styles.input,
              focusedField === "username" && styles.inputFocused,
            ]}
            placeholder="Username"
            placeholderTextColor={WARM.textMuted}
            value={username}
            onChangeText={setUsername}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[
              styles.input,
              focusedField === "password" && styles.inputFocused,
            ]}
            placeholder="Password"
            placeholderTextColor={WARM.textMuted}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            autoCapitalize="none"
          />

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In →</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate("Register")}
            disabled={loading}
          >
            <Text style={styles.registerLinkText}>
              Don't have an account?{" "}
              <Text style={styles.registerLinkBold}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM.surface,
  },
  scroll: {
    flexGrow: 1,
  },
  headerBand: {
    backgroundColor: WARM.accent,
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 28,
  },
  appLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1.5,
    lineHeight: 52,
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "400",
    lineHeight: 20,
  },
  card: {
    backgroundColor: WARM.surface,
    borderRadius: 28,
    padding: 28,
    marginHorizontal: 20,
    marginTop: -24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: WARM.border,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: WARM.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  input: {
    backgroundColor: WARM.bg,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: WARM.textPrimary,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: WARM.border,
  },
  inputFocused: {
    borderColor: WARM.accent,
    backgroundColor: WARM.surface,
  },
  button: {
    backgroundColor: WARM.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
    shadowColor: WARM.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  registerLink: {
    alignItems: "center",
    paddingVertical: 4,
  },
  registerLinkText: {
    fontSize: 14,
    color: WARM.textSecondary,
  },
  registerLinkBold: {
    color: WARM.accent,
    fontWeight: "700",
  },
});