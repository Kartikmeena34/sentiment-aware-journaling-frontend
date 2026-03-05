// InsightsScreen.js - COMPLETE POLISHED VERSION
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../service/api";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

const InsightsScreen = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dataSufficiency, setDataSufficiency] = useState(false);

  // Animation values for cards
  const [cardAnims] = useState(() => 
    Array(10).fill(0).map(() => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(20),
    }))
  );

  useEffect(() => {
    loadInsights();
  }, []);

  const animateCards = (count) => {
    const animations = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      animations.push(
        Animated.parallel([
          Animated.timing(cardAnims[i].fade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(cardAnims[i].slide, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    }
    Animated.stagger(100, animations).start();
  };

  const loadInsights = async () => {
    try {
      setError(null);
      const response = await api.get("/api/journal/insights/");
      const data = response.data;

      setInsights(data.insights || []);
      setDataSufficiency(data.data_sufficiency);
      
      // Trigger animation after data is set
      if (data.insights && data.insights.length > 0) {
        // Reset animations first
        cardAnims.forEach(anim => {
          anim.fade.setValue(0);
          anim.slide.setValue(20);
        });
        // Then animate
        setTimeout(() => animateCards(data.insights.length), 100);
      }
    } catch (error) {
      console.log("Failed to load insights:", error.response?.data || error.message);
      
      // Determine error type
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
    await loadInsights();
    setRefreshing(false);
  };

  const handleRetry = () => {
    setLoading(true);
    loadInsights();
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.caption, styles.loadingText]}>
          Loading insights...
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
          {error === "unknown" && "We couldn't load your insights"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state (not enough data)
  if (!dataSufficiency || insights.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.center}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Ionicons name="bulb-outline" size={64} color={colors.textMuted} />
        <Text style={[typography.section, styles.emptyTitle]}>
          No Insights Yet
        </Text>
        <Text style={[typography.body, styles.emptyMessage]}>
          Journal at least 3 times this week to unlock patterns and insights about your emotions
        </Text>
        <View style={styles.progressContainer}>
          <Text style={[typography.caption, styles.progressText]}>
            Pull down to refresh
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Success state (has insights)
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
      {insights.map((insight, index) => (
        <Animated.View
          key={index}
          style={[
            styles.card,
            {
              opacity: cardAnims[index]?.fade || 1,
              transform: [
                { translateY: cardAnims[index]?.slide || 0 }
              ],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons 
              name={
                insight.type === "baseline_shift" ? "trending-up-outline" :
                insight.type === "range_expanding" ? "resize-outline" :
                insight.type === "range_contracting" ? "contract-outline" :
                insight.type === "trend_increasing" ? "arrow-up-outline" :
                insight.type === "trend_decreasing" ? "arrow-down-outline" :
                "analytics-outline"
              }
              size={20}
              color={colors.primary}
            />
            <Text style={[typography.section, styles.insightTitle]}>
              {insight.title}
            </Text>
          </View>
          <Text style={[typography.body, styles.insightMessage]}>
            {insight.message}
          </Text>

          {insight.confidence && insight.confidence < 0.6 && (
            <View style={styles.confidenceBadge}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
              <Text style={[typography.caption, styles.confidenceNote]}>
                Pattern still forming
              </Text>
            </View>
          )}
        </Animated.View>
      ))}

      <Text style={[typography.caption, styles.footer]}>
        Insights update as you journal more
      </Text>
    </ScrollView>
  );
};

export default InsightsScreen;

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
    padding: spacing.xl,
  },
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
  progressContainer: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  progressText: {
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...elevation.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  insightTitle: {
    color: colors.textPrimary,
    flex: 1,
  },
  insightMessage: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confidenceNote: {
    color: colors.textMuted,
  },
  footer: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});