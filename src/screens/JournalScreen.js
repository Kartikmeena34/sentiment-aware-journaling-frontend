import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import api from "../service/api";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

export default function JournalScreen({ navigation }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setLoading(true);

    try {
      const response = await api.post("/api/journal/create/", {
        text,
      });

      const { dominant_emotion, confidence, insight, analytics } =
        response.data;

      setLoading(false);
      setText("");

      navigation.navigate("EmotionFeedback", {
        dominant_emotion,
        confidence,
        insight,
        analytics,
      });

    } catch (error) {
      console.log(
        "Journal submission failed:",
        error.response?.data || error.message
      );
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={[typography.title, styles.title]}>
        Write your thoughts
      </Text>

      <TextInput
        style={styles.input}
        multiline
        placeholder="How are you feeling today?"
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity
        style={[
          styles.button,
          (!text.trim() || loading) && styles.disabled,
        ]}
        disabled={!text.trim() || loading}
        onPress={handleSubmit}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Entry</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    justifyContent: "space-between",
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  input: {
    minHeight: 180,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    textAlignVertical: "top",
    marginBottom: spacing.lg,
    ...elevation.card,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
});