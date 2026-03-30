import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import api from "../service/api";

const WARM = {
  bg: "#FDF6EC",
  surface: "#FFFDF9",
  accent: "#C17B4E",
  accentSoft: "#F5E6D3",
  textPrimary: "#2D1B0E",
  textSecondary: "#7A5C44",
  textMuted: "#B09880",
  border: "#EDE0D0",
  success: "#6A9E7F",
};

const MAX_CHARS = 2000;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function JournalScreen({ navigation }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const charsLeft = MAX_CHARS - text.length;
  const isNearLimit = charsLeft < 200;
  const isEmpty = !text.trim();

  const handleSave = async () => {
    if (isEmpty) {
      Alert.alert("Empty Entry", "Write something before saving.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/api/journal/create/", {
        text: text.trim(),
      });
      const { contextual_message, has_insights } = response.data;
      setText("");
      navigation.navigate("EmotionFeedback", {
        contextual_message,
        has_insights,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to save entry. Please try again.");
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>{getFormattedDate()}</Text>
          <View style={styles.divider} />
        </Animated.View>

        {/* Writing area */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Decorative lines like ruled paper */}
          <View style={styles.ruledLines}>
            {[...Array(12)].map((_, i) => (
              <View key={i} style={styles.ruledLine} />
            ))}
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind today?"
            placeholderTextColor={WARM.textMuted}
            value={text}
            onChangeText={(t) => {
              if (t.length <= MAX_CHARS) setText(t);
            }}
            multiline
            textAlignVertical="top"
            autoFocus={false}
          />
        </Animated.View>

        {/* Character counter */}
        <Text
          style={[
            styles.charCount,
            isNearLimit && styles.charCountWarning,
          ]}
        >
          {charsLeft} characters remaining
        </Text>

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.button,
            isEmpty && styles.buttonDisabled,
          ]}
          disabled={loading || isEmpty}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Save Entry</Text>
              <Text style={styles.buttonSubtext}>
                Your thoughts, preserved
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM.bg,
  },
  scroll: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: WARM.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: WARM.textMuted,
    fontWeight: "400",
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  divider: {
    height: 2,
    width: 40,
    backgroundColor: WARM.accent,
    borderRadius: 2,
  },
  card: {
    backgroundColor: WARM.surface,
    borderRadius: 16,
    padding: 20,
    minHeight: 320,
    borderWidth: 1,
    borderColor: WARM.border,
    shadowColor: "#C17B4E",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    position: "relative",
    overflow: "hidden",
    marginBottom: 12,
  },
  ruledLines: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    justifyContent: "space-between",
  },
  ruledLine: {
    height: 1,
    backgroundColor: WARM.border,
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: WARM.textPrimary,
    lineHeight: 26,
    minHeight: 280,
    zIndex: 1,
    fontWeight: "400",
  },
  charCount: {
    fontSize: 12,
    color: WARM.textMuted,
    textAlign: "right",
    marginBottom: 24,
  },
  charCountWarning: {
    color: "#C17B4E",
    fontWeight: "600",
  },
  button: {
    backgroundColor: WARM.accent,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: WARM.accent,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  buttonSubtext: {
    color: "rgba(255,255,255,1)",
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
});