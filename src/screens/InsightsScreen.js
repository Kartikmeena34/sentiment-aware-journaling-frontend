import React, { useEffect, useState, useRef } from "react";
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
  danger: "#C17070",
};

const INSIGHT_CONFIG = {
  baseline_shift: {
    icon: "trending-up-outline",
    color: "#6A9E7F",
    bg: "#EEF7F2",
    label: "Baseline Shift",
  },
  range_expanding: {
    icon: "expand-outline",
    color: "#C17B4E",
    bg: "#F5E6D3",
    label: "Range Expanding",
  },
  range_contracting: {
    icon: "contract-outline",
    color: "#7A8EC1",
    bg: "#ECEEF7",
    label: "Range Contracting",
  },
  trend_increasing: {
    icon: "arrow-up-outline",
    color: "#6A9E7F",
    bg: "#EEF7F2",
    label: "Trending Up",
  },
  trend_decreasing: {
    icon: "arrow-down-outline",
    color: "#C17070",
    bg: "#F7EEEE",
    label: "Trending Down",
  },
  high_diversity: {
    icon: "color-palette-outline",
    color: "#C17B4E",
    bg: "#F5E6D3",
    label: "High Diversity",
  },
  weekly_summary: {
    icon: "calendar-outline",
    color: WARM.textSecondary,
    bg: "#F5F0EA",
    label: "Weekly Summary",
  },
  insufficient_data: {
    icon: "hourglass-outline",
    color: WARM.textMuted,
    bg: "#F5F0EA",
    label: "Getting Started",
  },
};

export default function InsightsScreen() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dataSufficiency, setDataSufficiency] = useState(false);
  const [weeklyConfidence, setWeeklyConfidence] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(
    Array(10).fill(0).map(() => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(24),
    }))
  ).current;

  useEffect(() => {
    loadInsights();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateCards = (count) => {
    cardAnims.forEach(a => {
      a.fade.setValue(0);
      a.slide.setValue(24);
    });
    const animations = Array.from({ length: Math.min(count, 10) }, (_, i) =>
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
    Animated.stagger(80, animations).start();
  };

  const loadInsights = async () => {
    try {
      setError(null);
      const response = await api.get("/api/journal/insights/");
      const data = response.data;
      setInsights(data.insights || []);
      setDataSufficiency(data.data_sufficiency);
      setWeeklyConfidence(data.weekly_confidence || 0);
      if (data.insights?.length > 0) {
        setTimeout(() => animateCards(data.insights.length), 100);
      }
    } catch (err) {
      setError(err.message === "Network Error" ? "network" : "unknown");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={WARM.accent} />
        <Text style={styles.loadingText}>Reading your patterns...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={56} color={WARM.textMuted} />
        <Text style={styles.errorTitle}>Couldn't load insights</Text>
        <Text style={styles.errorMessage}>Check your connection and try again</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); loadInsights(); }}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[WARM.accent]}
          tintColor={WARM.accent}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.screenTitle}>Your Insights</Text>
        <Text style={styles.screenSubtitle}>
          {dataSufficiency
            ? "Patterns from this week's entries"
            : "Keep journaling to unlock patterns"}
        </Text>
        <View style={styles.headerDivider} />
      </Animated.View>

      {/* Confidence badge */}
      {dataSufficiency && weeklyConfidence > 0 && (
        <Animated.View style={[styles.confidenceBanner, { opacity: fadeAnim }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={WARM.success} />
          <Text style={styles.confidenceText}>
            {Math.round(weeklyConfidence * 100)}% confidence this week
          </Text>
        </Animated.View>
      )}

      {/* Empty state */}
      {!dataSufficiency && (
        <Animated.View style={[styles.emptyCard, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="book-outline" size={32} color={WARM.accent} />
          </View>
          <Text style={styles.emptyTitle}>Not enough data yet</Text>
          <Text style={styles.emptyMessage}>
            Journal at least 3 times this week to unlock emotional patterns and insights.
          </Text>
          <View style={styles.emptyHint}>
            <Ionicons name="arrow-down-outline" size={14} color={WARM.textMuted} />
            <Text style={styles.emptyHintText}>Pull to refresh after journaling</Text>
          </View>
        </Animated.View>
      )}

      {/* Insight cards */}
      {insights.map((insight, index) => {
        const config = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.weekly_summary;
        return (
          <Animated.View
            key={index}
            style={[
              styles.card,
              {
                opacity: cardAnims[index]?.fade || 1,
                transform: [{ translateY: cardAnims[index]?.slide || 0 }],
              },
            ]}
          >
            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon} size={14} color={config.color} />
              <Text style={[styles.typeLabel, { color: config.color }]}>
                {config.label}
              </Text>
            </View>

            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightMessage}>{insight.message}</Text>

            {/* Low confidence note */}
            {insight.confidence > 0 && insight.confidence < 0.6 && (
              <View style={styles.lowConfidence}>
                <Ionicons name="information-circle-outline" size={13} color={WARM.textMuted} />
                <Text style={styles.lowConfidenceText}>Pattern still forming</Text>
              </View>
            )}
          </Animated.View>
        );
      })}

      {/* Footer */}
      {dataSufficiency && (
        <Text style={styles.footer}>
          Insights refresh as you add new entries
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM.bg,
  },
  content: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: WARM.bg,
    padding: 32,
  },
  header: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: WARM.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: WARM.textMuted,
    marginBottom: 20,
  },
  headerDivider: {
    height: 2,
    width: 40,
    backgroundColor: WARM.accent,
    borderRadius: 2,
  },
  confidenceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF7F2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  confidenceText: {
    fontSize: 12,
    color: WARM.success,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: WARM.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: WARM.border,
    borderStyle: "dashed",
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: WARM.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: WARM.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    color: WARM.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  emptyHintText: {
    fontSize: 12,
    color: WARM.textMuted,
  },
  card: {
    backgroundColor: WARM.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: WARM.border,
    shadowColor: "#C17B4E",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  insightTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: WARM.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  insightMessage: {
    fontSize: 14,
    color: WARM.textSecondary,
    lineHeight: 22,
  },
  lowConfidence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: WARM.border,
  },
  lowConfidenceText: {
    fontSize: 12,
    color: WARM.textMuted,
  },
  loadingText: {
    fontSize: 14,
    color: WARM.textMuted,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: WARM.textPrimary,
    marginTop: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: WARM.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: WARM.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  footer: {
    fontSize: 12,
    color: WARM.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
});