// EmotionFeedbackScreen.js - POLISHED VERSION
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

export default function EmotionFeedbackScreen({ route, navigation }) {
  const { contextual_message, has_insights } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered animation sequence
    Animated.sequence([
      // Icon scale
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Card fade and slide
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          </View>
        </Animated.View>

        {/* Card with message */}
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[typography.title, styles.confirmation]}>
            Entry Saved
          </Text>

          {contextual_message && (
            <View style={styles.contextualContainer}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[typography.body, styles.contextual]}>
                {contextual_message}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {has_insights ? (
            <View style={styles.hintContainer}>
              <Ionicons name="bulb-outline" size={18} color={colors.textSecondary} />
              <Text style={[typography.caption, styles.hint]}>
                Check your Insights tab to discover patterns
              </Text>
            </View>
          ) : (
            <View style={styles.hintContainer}>
              <Ionicons name="hourglass-outline" size={18} color={colors.textSecondary} />
              <Text style={[typography.caption, styles.hint]}>
                Keep journaling to unlock insights
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Action Button */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Main", { screen: "Journal" })}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...elevation.card,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...elevation.card,
  },
  confirmation: {
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  contextualContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  contextual: {
    color: colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
  },
  hint: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    ...elevation.button,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
});