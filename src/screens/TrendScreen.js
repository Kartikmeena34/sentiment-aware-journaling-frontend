import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import api from "../service/api";
import { AuthContext } from "../context/AuthContext";
import { useRoute } from "@react-navigation/native";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

const TrendScreen = () => {
  const { logout } = useContext(AuthContext);
  const route = useRoute();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const animatedValuesRef = useRef([]);

  const passedAnalytics = route.params?.analytics;

  // Load analytics
  useEffect(() => {
    initializeScreen();
  }, [passedAnalytics]);

  const initializeScreen = async () => {
    try {
      if (passedAnalytics) {
        setAnalytics(passedAnalytics);
      } else {
        const response = await api.get("/api/journal/analytics/");
        setAnalytics(response.data);
      }
    } catch (error) {
      console.log(
        "Failed to load analytics:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Animate bars when distribution updates
  useEffect(() => {
    if (!analytics?.weekly_distribution) return;

    const entries = Object.entries(analytics.weekly_distribution);

    animatedValuesRef.current = entries.map(
      (_, index) =>
        animatedValuesRef.current[index] || new Animated.Value(0)
    );

    const animations = entries.map(([, value], index) =>
      Animated.timing(animatedValuesRef.current[index], {
        toValue: value,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );

    Animated.stagger(60, animations).start();
  }, [analytics?.weekly_distribution]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!analytics?.data_sufficiency) {
    return (
      <View style={styles.center}>
        <Text style={[typography.body, styles.placeholder]}>
          Keep journaling to see clearer emotional patterns.
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    weekly_distribution,
    trends,
    weekly_confidence,
    emotional_entropy,
  } = analytics;

  const getEntropyLabel = (entropy) => {
    if (entropy >= 2) return "Broad emotional range";
    if (entropy >= 1) return "Varied emotional mix";
    return "Focused emotional pattern";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {weekly_confidence < 0.5 && (
        <Text style={[typography.caption, styles.subtleNote]}>
          Patterns are still forming.
        </Text>
      )}

      {/* Emotional Range */}
      <View style={styles.card}>
        <Text style={[typography.section, styles.sectionTitle]}>
          Emotional Range
        </Text>
        <Text style={[typography.body, styles.entropyLabel]}>
          {getEntropyLabel(emotional_entropy)}
        </Text>
      </View>

      {/* Weekly Distribution */}
      <View style={styles.card}>
        <Text style={[typography.section, styles.sectionTitle]}>
          Weekly Distribution
        </Text>

        {Object.entries(weekly_distribution).map(
          ([emotion, value], index) => (
            <View key={emotion} style={styles.barWrapper}>
              <View style={styles.barHeader}>
                <Text style={[typography.body, styles.emotionText]}>
                  {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                </Text>
                <Text style={[typography.caption, styles.percentText]}>
                  {(value * 100).toFixed(0)}%
                </Text>
              </View>

              <View style={styles.barBackground}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      width: animatedValuesRef.current[index]
                        ? animatedValuesRef.current[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", `${value * 100}%`],
                          })
                        : "0%",
                    },
                  ]}
                />
              </View>
            </View>
          )
        )}
      </View>

      {/* Trends */}
      {Object.keys(trends).length > 0 && (
        <View style={styles.card}>
          <Text style={[typography.section, styles.sectionTitle]}>
            Trends
          </Text>

          {Object.entries(trends).map(([emotion, direction]) => (
            <View key={emotion} style={styles.trendRow}>
              <Text style={[typography.body, styles.emotionText]}>
                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              </Text>
              <Text style={styles.trendIcon}>
                {direction === "increasing" ? "↑" : "↓"}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TrendScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  placeholder: {
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  subtleNote: {
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...elevation.card,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  entropyLabel: {
    color: colors.textSecondary,
  },
  barWrapper: {
    marginBottom: spacing.md,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  emotionText: {
    color: colors.textPrimary,
  },
  percentText: {
    color: colors.textSecondary,
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  trendIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    backgroundColor: colors.danger,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
});