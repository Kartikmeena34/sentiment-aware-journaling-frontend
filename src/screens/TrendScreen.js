// TrendScreen.js - WITH ERROR HANDLING
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../service/api";
import { useRoute } from "@react-navigation/native";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

const TrendScreen = () => {
  const route = useRoute();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const animatedValuesRef = useRef([]);

  const passedAnalytics = route.params?.analytics;

  // Animation function
  const runAnimation = (distribution) => {
    const entries = Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    animatedValuesRef.current = entries.map(
      () => new Animated.Value(0)
    );

    const animations = entries.map(([_, value], index) =>
      Animated.timing(animatedValuesRef.current[index], {
        toValue: Math.max(value * 100, 4),
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );

    Animated.stagger(80, animations).start();
  };

  // Load data
  useEffect(() => {
    initializeScreen();
  }, [passedAnalytics]);

  const initializeScreen = async () => {
    try {
      setError(null);
      let data;

      if (passedAnalytics) {
        data = passedAnalytics;
      } else {
        const response = await api.get("/api/journal/analytics/");
        data = response.data;
      }

      setAnalytics(data);

      if (data?.weekly_distribution) {
        runAnimation(data.weekly_distribution);
      }
    } catch (error) {
      console.log(
        "Failed to load analytics:",
        error.response?.data || error.message
      );
      
      if (error.message === "Network Error" || !error.response) {
        setError("network");
      } else if (error.response?.status >= 500) {
        setError("server");
      } else {
        setError("unknown");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setError(null);
      const response = await api.get("/api/journal/analytics/");
      const data = response.data;

      setAnalytics(data);

      if (data?.weekly_distribution) {
        runAnimation(data.weekly_distribution);
      }
    } catch (error) {
      console.log(
        "Refresh failed:",
        error.response?.data || error.message
      );
      
      if (error.message === "Network Error" || !error.response) {
        setError("network");
      } else if (error.response?.status >= 500) {
        setError("server");
      } else {
        setError("unknown");
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    initializeScreen();
  };

  const getEntropyLabel = (entropy) => {
    if (entropy >= 2) return "Your emotions are varied this week";
    if (entropy >= 1) return "Varied emotional mix";
    return "Focused emotional pattern";
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.caption, styles.loadingText]}>
          Analyzing your patterns...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons 
          name={error === "network" ? "cloud-offline-outline" : "alert-circle-outline"} 
          size={64} 
          color={colors.textMuted} 
        />
        <Text style={[typography.section, styles.errorTitle]}>
          {error === "network" && "No Internet Connection"}
          {error === "server" && "Server Error"}
          {error === "unknown" && "Something Went Wrong"}
        </Text>
        <Text style={[typography.body, styles.errorMessage]}>
          {error === "network" && "Check your connection and try again"}
          {error === "server" && "Our servers are having issues. Try again in a moment"}
          {error === "unknown" && "We couldn't load your trends"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state (not enough data)
  if (!analytics?.data_sufficiency) {
    return (
      <View style={styles.center}>
        <Ionicons name="analytics-outline" size={64} color={colors.textMuted} />
        <Text style={[typography.section, styles.emptyTitle]}>
          Not Enough Data Yet
        </Text>
        <Text style={[typography.body, styles.emptyMessage]}>
          Keep journaling to see clearer emotional patterns. We need at least 3 entries from this week.
        </Text>
      </View>
    );
  }

  const {
    weekly_distribution,
    trends,
    weekly_confidence,
    emotional_entropy,
  } = analytics;

  const topEmotions = Object.entries(weekly_distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
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

        {topEmotions.map(([emotion, value], index) => (
          <View key={emotion} style={styles.barWrapper}>
            <View style={styles.barHeader}>
              <Text style={[typography.body, styles.emotionText]}>
                {(emotion || "unknown").charAt(0).toUpperCase() + (emotion || "unknown").slice(1)}
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
                          inputRange: [0, 100],
                          outputRange: ["0%", "100%"],
                        })
                      : "0%",
                  },
                ]}
              />
            </View>
          </View>
        ))}
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
                {(emotion || "unknown").charAt(0).toUpperCase() + (emotion || "unknown").slice(1)}
              </Text>
              <Text style={styles.trendIcon}>
                {direction === "increasing" ? "↑" : "↓"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default TrendScreen;

// Add these new styles to your existing styles object:
const styles = StyleSheet.create({
  // ... keep all your existing styles ...
  
  // Add these new ones:
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  errorMessage: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  emptyTitle: {
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  emptyMessage: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  
  // ... keep all other existing styles below ...
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
});