// JournalScreen.js
import React, { useState } from "react";
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
} from "react-native";
import api from "../service/api";
import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

export default function JournalScreen({ navigation }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState("journal"); // "journal" | "reflect"

  const handleModeSwitch = (mode) => {
    if (mode === "reflect") {
      navigation.navigate("Reflect");
    } else {
      setActiveMode("journal");
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert("Empty Entry", "Please write something before saving");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/journal/create/", {
        text: text.trim(),
      });

      const { contextual_message, has_insights, crisis_flag } = response.data;
      setText("");

      navigation.navigate("EmotionFeedback", {
        contextual_message,
        has_insights,
        crisis_flag: crisis_flag || false,
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
      <View style={styles.content}>

        {/* ── Mode Toggle ── */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeMode === "journal" && styles.toggleButtonActive,
            ]}
            onPress={() => setActiveMode("journal")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                activeMode === "journal" && styles.toggleTextActive,
              ]}
            >
              Journal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeMode === "reflect" && styles.toggleButtonActive,
            ]}
            onPress={() => handleModeSwitch("reflect")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                activeMode === "reflect" && styles.toggleTextActive,
              ]}
            >
              Reflect
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Write your thoughts</Text>
        </View>

        {/* ── Text Input ── */}
        <TextInput
          style={styles.textInput}
          placeholder="How are you feeling today?"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Entry</Text>
          )}
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // ── Toggle ──
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.lg,
    ...elevation.card,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: "#fff",
  },

  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
    textAlignVertical: "top",
    ...elevation.card,
    marginBottom: spacing.lg,
    lineHeight: 24,
    minHeight: 200,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    ...elevation.card,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});