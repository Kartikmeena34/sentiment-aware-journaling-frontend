// EmotionFeedbackScreen.js
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
import { getFeedbackHint } from "../utils/intimacy";

const CRISIS_MESSAGE =
  "It sounds like you've been carrying a lot lately. You don't have to work through this alone — consider reaching out to someone you trust.";

// How many entries needed before insights unlock
const INSIGHTS_THRESHOLD = 3;

export default function EmotionFeedbackScreen({ route, navigation }) {
  const {
    contextual_message,
    has_insights,
    crisis_flag,
    entry_count = 0,
    from_reflect = false,
  } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const crisisAnim = useRef(new Animated.Value(0)).current;

  const hintText = getFeedbackHint(entry_count, has_insights);

  // Progress toward insights unlock (only shown when not yet unlocked)
  const showProgress = !has_insights && entry_count < INSIGHTS_THRESHOLD;
  const progressLabel = `Entry ${Math.min(entry_count, INSIGHTS_THRESHOLD)} of ${INSIGHTS_THRESHOLD}`;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
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
      ...(crisis_flag
        ? [Animated.timing(crisisAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })]
        : []),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {/* ── Success Icon ── */}
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          </View>
        </Animated.View>

        {/* ── Main Card ── */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[typography.title, styles.confirmation]}>
            {from_reflect ? "Reflection Saved" : "Entry Saved"}
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

          {/* ── Progress indicator or hint ── */}
          {showProgress ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Ionicons name="hourglass-outline" size={16} color={colors.textSecondary} />
                <Text style={[typography.caption, styles.progressLabel]}>
                  {progressLabel} — journal more to unlock insights
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(entry_count / INSIGHTS_THRESHOLD) * 100}%` },
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.hintContainer}>
              <Ionicons
                name={has_insights ? "bulb-outline" : "hourglass-outline"}
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[typography.caption, styles.hint]}>
                {hintText}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── Crisis Card ── */}
        {crisis_flag && (
          <Animated.View style={[styles.crisisCard, { opacity: crisisAnim }]}>
            <View style={styles.crisisHeader}>
              <Ionicons name="heart-outline" size={18} color="#B8760A" />
              <Text style={[typography.section, styles.crisisTitle]}>
                A Gentle Check-In
              </Text>
            </View>
            <Text style={[typography.body, styles.crisisMessage]}>
              {CRISIS_MESSAGE}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* ── Done Button ── */}
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
    gap: spacing.lg,
  },
  iconContainer: { marginBottom: spacing.sm },
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
    flex: 1,
  },

  // ── Progress ──
  progressContainer: { width: "100%" },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressLabel: {
    color: colors.textSecondary,
    flex: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  // ── Crisis Card ──
  crisisCard: {
    width: "100%",
    backgroundColor: "#FFF8EE",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: "#F5A623",
    elevation: 2,
  },
  crisisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  crisisTitle: { color: "#B8760A" },
  crisisMessage: { color: "#7A5200", lineHeight: 22 },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    ...elevation.card,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
});