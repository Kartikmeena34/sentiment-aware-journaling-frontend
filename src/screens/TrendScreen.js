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

// Each emotion gets its own color
const EMOTION_COLORS = {
  joy:      { bar: "#E8A838", bg: "#FEF7E6" },
  sadness:  { bar: "#7A8EC1", bg: "#ECEEF7" },
  anger:    { bar: "#C17070", bg: "#F7EEEE" },
  fear:     { bar: "#9B72C1", bg: "#F3EEFB" },
  disgust:  { bar: "#7FAE6E", bg: "#EEF4EA" },
  surprise: { bar: "#C1A84E", bg: "#F7F3E6" },
  neutral:  { bar: "#B09880", bg: "#F5F0EA" },
};

const DEFAULT_COLOR = { bar: WARM.accent, bg: WARM.accentSoft };

function getEmotionColor(emotion) {
  return EMOTION_COLORS[emotion?.toLowerCase()] || DEFAULT_COLOR;
}

function getEntropyLabel(entropy) {
  if (entropy >= 2) return { label: "Wide Range", desc: "You expressed many different emotions this week", icon: "expand-outline", color: WARM.success };
  if (entropy >= 1) return { label: "Moderate Range", desc: "A balanced emotional mix this week", icon: "reorder-two-outline", color: WARM.accent };
  return { label: "Focused", desc: "Your emotions were concentrated this week", icon: "contract-outline", color: "#7A8EC1" };
}

export default function TrendScreen() {
  const route = useRoute();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const animatedValuesRef = useRef(
  Array(5).fill(0).map(() => new Animated.Value(0))
);
  const passedAnalytics = route.params?.analytics;

  const runAnimation = (distribution) => {
    const entries = Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    animatedValuesRef.current = entries.map(() => new Animated.Value(0));

    Animated.stagger(
      80,
      entries.map(([_, value], index) =>
        Animated.timing(animatedValuesRef.current[index], {
          toValue: Math.max(value * 100, 4),
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    ).start();
  };

  useEffect(() => {
    initializeScreen();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [passedAnalytics]);

  const initializeScreen = async () => {
    try {
      setError(null);
      let data = passedAnalytics;
      if (!data) {
        const response = await api.get("/api/journal/analytics/");
        data = response.data;
      }
      setAnalytics(data);
      if (data?.weekly_distribution) {
        setTimeout(() => runAnimation(data.weekly_distribution), 200);
      }
    } catch (err) {
      setError(err.message === "Network Error" ? "network" : "unknown");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get("/api/journal/analytics/");
      setAnalytics(response.data);
      if (response.data?.weekly_distribution) {
        runAnimation(response.data.weekly_distribution);
      }
    } catch (err) {
      setError("unknown");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={WARM.accent} />
        <Text style={styles.loadingText}>Analyzing your patterns...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={56} color={WARM.textMuted} />
        <Text style={styles.errorTitle}>Couldn't load trends</Text>
        <Text style={styles.errorMessage}>Check your connection and try again</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => { setLoading(true); initializeScreen(); }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!analytics?.data_sufficiency) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[WARM.accent]} tintColor={WARM.accent} />
        }
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.screenTitle}>Your Trends</Text>
          <Text style={styles.screenSubtitle}>Emotional patterns over time</Text>
          <View style={styles.headerDivider} />
        </Animated.View>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="analytics-outline" size={32} color={WARM.accent} />
          </View>
          <Text style={styles.emptyTitle}>Not enough data yet</Text>
          <Text style={styles.emptyMessage}>
            Journal at least 3 times this week to see your emotional distribution and trends.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const { weekly_distribution, trends, weekly_confidence, emotional_entropy } = analytics;
  const topEmotions = Object.entries(weekly_distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const entropyInfo = getEntropyLabel(emotional_entropy);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[WARM.accent]} tintColor={WARM.accent} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.screenTitle}>Your Trends</Text>
        <Text style={styles.screenSubtitle}>This week's emotional patterns</Text>
        <View style={styles.headerDivider} />
      </Animated.View>

      {/* Low confidence note */}
      {weekly_confidence < 0.5 && (
        <Animated.View style={[styles.warningBanner, { opacity: fadeAnim }]}>
          <Ionicons name="information-circle-outline" size={14} color={WARM.accent} />
          <Text style={styles.warningText}>Patterns are still forming — journal more for clearer trends</Text>
        </Animated.View>
      )}

      {/* Entropy card */}
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.cardLabelRow}>
          <Text style={styles.cardLabel}>Emotional Range</Text>
          <View style={[styles.entropyBadge, { backgroundColor: entropyInfo.color + "20" }]}>
            <Ionicons name={entropyInfo.icon} size={12} color={entropyInfo.color} />
            <Text style={[styles.entropyBadgeText, { color: entropyInfo.color }]}>
              {entropyInfo.label}
            </Text>
          </View>
        </View>
        <Text style={styles.entropyDesc}>{entropyInfo.desc}</Text>

        {/* Entropy visual bar */}
        <View style={styles.entropyTrack}>
          <Animated.View
            style={[
              styles.entropyFill,
              {
                width: `${Math.min((emotional_entropy / 3) * 100, 100)}%`,
                backgroundColor: entropyInfo.color,
              },
            ]}
          />
        </View>
        <View style={styles.entropyLabels}>
          <Text style={styles.entropyLabelText}>Focused</Text>
          <Text style={styles.entropyLabelText}>Wide</Text>
        </View>
      </Animated.View>

      {/* Weekly Distribution */}
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <Text style={styles.cardLabel}>Weekly Distribution</Text>
        <Text style={styles.cardSublabel}>Top emotions this week</Text>

        {topEmotions.map(([emotion, value], index) => {
          const ec = getEmotionColor(emotion);
          return (
            <View key={emotion} style={styles.barWrapper}>
              <View style={styles.barHeader}>
                <View style={styles.emotionNameRow}>
                  <View style={[styles.emotionDot, { backgroundColor: ec.bar }]} />
                  <Text style={styles.emotionText}>
                    {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                  </Text>
                </View>
                <Text style={styles.percentText}>{(value * 100).toFixed(0)}%</Text>
              </View>
              <View style={styles.barBackground}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: ec.bar,
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
          );
        })}
      </Animated.View>

      {/* Trends */}
      {Object.keys(trends).length > 0 && (
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Text style={styles.cardLabel}>Within-Week Trends</Text>
          <Text style={styles.cardSublabel}>How emotions shifted across entries</Text>

          {Object.entries(trends).map(([emotion, direction]) => {
            const ec = getEmotionColor(emotion);
            const isUp = direction === "increasing";
            return (
              <View key={emotion} style={styles.trendRow}>
                <View style={styles.emotionNameRow}>
                  <View style={[styles.emotionDot, { backgroundColor: ec.bar }]} />
                  <Text style={styles.emotionText}>
                    {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                  </Text>
                </View>
                <View style={[
                  styles.trendBadge,
                  { backgroundColor: isUp ? "#EEF7F2" : "#F7EEEE" }
                ]}>
                  <Ionicons
                    name={isUp ? "trending-up-outline" : "trending-down-outline"}
                    size={14}
                    color={isUp ? WARM.success : WARM.danger}
                  />
                  <Text style={[
                    styles.trendBadgeText,
                    { color: isUp ? WARM.success : WARM.danger }
                  ]}>
                    {isUp ? "Rising" : "Falling"}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      )}

      {/* Confidence footer */}
      <Text style={styles.footer}>
        Based on {Math.round(weekly_confidence * 100)}% avg confidence · Pull to refresh
      </Text>
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
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: WARM.accentSoft,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: WARM.textSecondary,
    flex: 1,
    lineHeight: 18,
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
  cardLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: WARM.textPrimary,
    letterSpacing: -0.2,
  },
  cardSublabel: {
    fontSize: 12,
    color: WARM.textMuted,
    marginBottom: 16,
    marginTop: 2,
  },
  entropyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  entropyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  entropyDesc: {
    fontSize: 13,
    color: WARM.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  entropyTrack: {
    height: 8,
    backgroundColor: WARM.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  entropyFill: {
    height: 8,
    borderRadius: 4,
  },
  entropyLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entropyLabelText: {
    fontSize: 11,
    color: WARM.textMuted,
  },
  barWrapper: {
    marginBottom: 14,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  emotionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emotionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emotionText: {
    fontSize: 14,
    color: WARM.textPrimary,
    fontWeight: "500",
  },
  percentText: {
    fontSize: 13,
    color: WARM.textMuted,
    fontWeight: "600",
  },
  barBackground: {
    height: 8,
    backgroundColor: WARM.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: "700",
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