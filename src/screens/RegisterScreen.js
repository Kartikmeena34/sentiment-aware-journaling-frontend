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

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { login } = useContext(AuthContext);

  // Animation values
  const headerSlide = useRef(new Animated.Value(-60)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      // Header slides down from top
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
      // Card slides up from bottom — slight delay
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
      // Button scales in last
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

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/register/", {
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
      });
      const { access, refresh, user } = response.data;
      if (!access || !refresh) throw new Error("Invalid response");
      await login(access, refresh, user);
    } catch (error) {
      let msg = "Registration failed. Please try again.";
      if (error.response?.data) {
        const d = error.response.data;
        if (d.username) msg = Array.isArray(d.username) ? d.username[0] : "Username already exists";
        else if (d.email) msg = Array.isArray(d.email) ? d.email[0] : "Email already exists";
        else if (d.password) msg = Array.isArray(d.password) ? d.password[0] : "Password too weak";
        else if (d.message) msg = d.message;
      } else if (error.request) {
        msg = "Cannot connect to server.";
      }
      Alert.alert("Registration Failed", msg);
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
          <Text style={styles.headerTitle}>Begin your{"\n"}journey.</Text>
          <Text style={styles.headerSubtitle}>
            A private space to understand yourself
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
          <Text style={styles.cardTitle}>Create Account</Text>

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
              focusedField === "email" && styles.inputFocused,
            ]}
            placeholder="Email address"
            placeholderTextColor={WARM.textMuted}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[
              styles.input,
              focusedField === "password" && styles.inputFocused,
            ]}
            placeholder="Password (min 8 characters)"
            placeholderTextColor={WARM.textMuted}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={[
              styles.input,
              focusedField === "confirm" && styles.inputFocused,
            ]}
            placeholder="Confirm Password"
            placeholderTextColor={WARM.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedField("confirm")}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            autoCapitalize="none"
          />

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={handleRegister}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account →</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
            disabled={loading}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{" "}
              <Text style={styles.loginLinkBold}>Sign in</Text>
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
    backgroundColor: WARM.accent,
  },
  scroll: {
    flexGrow: 1,
  },
  headerBand: {
    backgroundColor: WARM.accent,
    paddingTop: 72,
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
    fontSize: 40,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 46,
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
    padding: 24,
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
  loginLink: {
    alignItems: "center",
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 14,
    color: WARM.textSecondary,
  },
  loginLinkBold: {
    color: WARM.accent,
    fontWeight: "700",
  },
});