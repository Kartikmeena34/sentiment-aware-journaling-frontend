// InsightsScreen.js
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
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../service/api";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

const CRISIS_MESSAGE =
  "It sounds like you've been carrying a lot lately. You don't have to work through this alone — consider reaching out to someone you trust.";

const InsightsScreen = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dataSufficiency, setDataSufficiency] = useState(false);
  const [crisisFlag, setCrisisFlag] = useState(false);
  const [weeklyEntryCount, setWeeklyEntryCount] = useState(0);
  const [showConfidenceTooltip, setShowConfidenceTooltip] = useState(false);

  const INSIGHTS_THRESHOLD = 3;

  const [cardAnims] = useState(() =>
    Array(10).fill(0).map(() => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(20),
    }))
  );
  const crisisAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadInsights();
  }, []);

  const animateCards = (count, hasCrisis) => {
    const animations = [];
    if (hasCrisis) {
      animations.push(
        Animated.timing(crisisAnim, { toValue: 1, duration: 500, useNativeDriver: true })
      );
    }
    for (let i = 0; i < Math.min(count, 10); i++) {
      animations.push(
        Animated.parallel([
          Animated.timing(cardAnims[i].fade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(cardAnims[i].slide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      );
    }
    Animated.stagger(100, animations).start();
  };

  const loadInsights = async () => {
    try {
      setError(null);

      // Fetch insights + weekly entry count in parallel
      const [insightsRes, historyRes] = await Promise.all([
        api.get("/api/journal/insights/"),
        api.get("/api/journal/history/"),
      ]);

      const data = insightsRes.data;

      // Count entries from this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekCount = historyRes.data.filter(
        e => new Date(e.created_at) >= oneWeekAgo
      ).length;

      setInsights(data.insights || []);
      setDataSufficiency(data.data_sufficiency);
      setCrisisFlag(data.crisis_flag || false);
      setWeeklyEntryCount(weekCount);

      cardAnims.forEach(a => { a.fade.setValue(0); a.slide.setValue(20); });
      crisisAnim.setValue(0);
      setTimeout(() => animateCards((data.insights || []).length, data.crisis_flag || false), 100);

    } catch (error) {
      if (error.message === "Network Error" || !error.response) setError("network");
      else if (error.response?.status >= 500) setError("server");
      else setError("unknown");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const handleRetry = () => { setLoading(true); loadInsights(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.caption, styles.loadingText]}>Loading insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons
          name={error === "network" ? "cloud-offline-outline" : "alert-circle-outline"}
          size={64} color={colors.textMuted}
        />
        <Text style={[typography.section, styles.errorTitle]}>
          {error === "network" ? "No Internet Connection" :
           error === "server" ? "Server Error" : "Something Went Wrong"}
        </Text>
        <Text style={[typography.body, styles.errorMessage]}>
          {error === "network" ? "Check your connection and try again" :
           error === "server" ? "Our servers are having issues. Try again in a moment" :
           "We couldn't load your insights"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state — show real progress count
  if (!dataSufficiency || insights.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.center}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <Ionicons name="bulb-outline" size={64} color={colors.textMuted} />
        <Text style={[typography.section, styles.emptyTitle]}>No Insights Yet</Text>

        {/* Real progress count */}
        <Text style={[typography.body, styles.emptyMessage]}>
          {weeklyEntryCount} of {INSIGHTS_THRESHOLD} entries this week
        </Text>
        <Text style={[typography.caption, styles.emptySubtext]}>
          Journal {Math.max(0, INSIGHTS_THRESHOLD - weeklyEntryCount)} more time{INSIGHTS_THRESHOLD - weeklyEntryCount !== 1 ? "s" : ""} to unlock insights
        </Text>

        {/* Progress bar */}
        <View style={styles.emptyProgressBg}>
          <View style={[
            styles.emptyProgressFill,
            { width: `${Math.min((weeklyEntryCount / INSIGHTS_THRESHOLD) * 100, 100)}%` }
          ]} />
        </View>

        <View style={styles.progressContainer}>
          <Text style={[typography.caption, styles.progressText]}>Pull down to refresh</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      {/* ── Crisis Card ── */}
      {crisisFlag && (
        <Animated.View style={[styles.crisisCard, { opacity: crisisAnim }]}>
          <View style={styles.crisisHeader}>
            <Ionicons name="heart-outline" size={20} color="#B8760A" />
            <Text style={[typography.section, styles.crisisTitle]}>A Gentle Check-In</Text>
          </View>
          <Text style={[typography.body, styles.crisisMessage]}>{CRISIS_MESSAGE}</Text>
        </Animated.View>
      )}

      {/* ── Insight Cards ── */}
      {insights.map((insight, index) => (
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
          <View style={styles.cardHeader}>
            <Ionicons
              name={
                insight.type === "baseline_shift" ? "trending-up-outline" :
                insight.type === "range_expanding" ? "resize-outline" :
                insight.type === "range_contracting" ? "contract-outline" :
                insight.type === "trend_increasing" ? "arrow-up-outline" :
                insight.type === "trend_decreasing" ? "arrow-down-outline" :
                insight.type === "reflect_divergence" ? "git-compare-outline" :
                insight.type === "reflect_arc" ? "chatbubbles-outline" :
                "analytics-outline"
              }
              size={20} color={colors.primary}
            />
            <Text style={[typography.section, styles.insightTitle]}>{insight.title}</Text>
          </View>

          <Text style={[typography.body, styles.insightMessage]}>{insight.message}</Text>

          {/* ── Confidence badge with tooltip ── */}
          {insight.confidence !== undefined && (
            <View style={styles.confidenceRow}>
              {insight.confidence < 0.6 && (
                <View style={styles.confidenceBadge}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                  <Text style={[typography.caption, styles.confidenceNote]}>
                    Pattern still forming
                  </Text>
                </View>
              )}
              {/* Confidence tooltip trigger */}
              <TouchableOpacity
                style={styles.confidenceTrigger}
                onPress={() => setShowConfidenceTooltip(true)}
              >
                <Text style={styles.confidencePercent}>
                  {Math.round((insight.confidence || 0) * 100)}% confidence
                </Text>
                <Ionicons name="help-circle-outline" size={13} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      ))}

      <Text style={[typography.caption, styles.footer]}>
        Insights update as you journal more
      </Text>

      {/* ── Confidence Tooltip Modal ── */}
      <Modal
        visible={showConfidenceTooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfidenceTooltip(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowConfidenceTooltip(false)}
        >
          <View style={styles.tooltipBox}>
            <Text style={[typography.section, styles.tooltipTitle]}>About Confidence</Text>
            <Text style={[typography.body, styles.tooltipText]}>
              Confidence reflects how certain the model is about your emotion detection. Higher confidence means the detected emotion was more clearly expressed in your writing.
            </Text>
            <TouchableOpacity
              style={styles.tooltipClose}
              onPress={() => setShowConfidenceTooltip(false)}
            >
              <Text style={styles.tooltipCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

export default InsightsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: { color: colors.textSecondary, marginTop: spacing.md },
  errorTitle: { color: colors.textPrimary, marginTop: spacing.lg, textAlign: "center" },
  errorMessage: {
    color: colors.textSecondary, marginTop: spacing.sm,
    textAlign: "center", paddingHorizontal: spacing.xl,
  },
  retryButton: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl, borderRadius: radius.md, marginTop: spacing.xl,
  },
  retryText: { color: "#fff", fontWeight: "600", fontSize: typography.body.fontSize },
  emptyTitle: { color: colors.textPrimary, marginTop: spacing.lg, textAlign: "center" },
  emptyMessage: {
    color: colors.primary, marginTop: spacing.md,
    textAlign: "center", fontWeight: "600", fontSize: 16,
  },
  emptySubtext: {
    color: colors.textSecondary, marginTop: spacing.xs,
    textAlign: "center",
  },
  emptyProgressBg: {
    width: "60%", height: 6, backgroundColor: colors.border,
    borderRadius: 3, overflow: "hidden", marginTop: spacing.lg,
  },
  emptyProgressFill: {
    height: 6, backgroundColor: colors.primary, borderRadius: 3,
  },
  progressContainer: {
    marginTop: spacing.xl, padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
  },
  progressText: { color: colors.textMuted },

  // ── Crisis Card ──
  crisisCard: {
    backgroundColor: "#FFF8EE", borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.lg,
    borderLeftWidth: 4, borderLeftColor: "#F5A623", elevation: 2,
  },
  crisisHeader: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.sm, marginBottom: spacing.sm,
  },
  crisisTitle: { color: "#B8760A" },
  crisisMessage: { color: "#7A5200", lineHeight: 22 },

  // ── Insight Cards ──
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.lg, ...elevation.card,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.sm, marginBottom: spacing.sm,
  },
  insightTitle: { color: colors.textPrimary, flex: 1 },
  insightMessage: { color: colors.textSecondary, lineHeight: 22 },

  // ── Confidence ──
  confidenceRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginTop: spacing.sm,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  confidenceBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  confidenceNote: { color: colors.textMuted },
  confidenceTrigger: {
    flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto",
  },
  confidencePercent: { color: colors.textMuted, fontSize: 12 },

  footer: {
    color: colors.textMuted, textAlign: "center",
    marginTop: spacing.md, marginBottom: spacing.xl,
  },

  // ── Tooltip Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center", alignItems: "center", padding: spacing.xl,
  },
  tooltipBox: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.xl, width: "100%", ...elevation.card,
  },
  tooltipTitle: { color: colors.textPrimary, marginBottom: spacing.md },
  tooltipText: { color: colors.textSecondary, lineHeight: 22 },
  tooltipClose: {
    marginTop: spacing.lg, backgroundColor: colors.primary,
    paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: "center",
  },
  tooltipCloseText: { color: "#fff", fontWeight: "600" },
});