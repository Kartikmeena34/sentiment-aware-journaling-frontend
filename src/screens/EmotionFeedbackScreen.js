import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

export default function EmotionFeedbackScreen({ route, navigation }) {
  const { dominant_emotion, confidence, insight, analytics } = route.params;

  const confidencePercent = Math.round(confidence * 100);

  return (
    <View style={styles.container}>
      
      <View style={styles.card}>
        <Text style={[typography.section, styles.label]}>
          Reflection
        </Text>

        <Text style={[typography.title, styles.emotion]}>
          {dominant_emotion.charAt(0).toUpperCase() +
            dominant_emotion.slice(1)}
        </Text>

        <Text style={[typography.caption, styles.confidence]}>
          Confidence {confidencePercent}%
        </Text>

        <Text style={[typography.body, styles.insight]}>
          {insight}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate("Main", {
            screen: "Trends",
            params: { analytics },
          })
        }
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>View Insights</Text>
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
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...elevation.card,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emotion: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  confidence: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  insight: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
});