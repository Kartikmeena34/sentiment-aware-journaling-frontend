// ProfileScreen.js
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import api from "../service/api";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

const ARC_ICONS = {
  resolution: "trending-up-outline",
  deepening: "trending-down-outline",
  stable: "remove-outline",
  shifting: "shuffle-outline",
};

const ProfileScreen = ({ navigation }) => {
  const { logout, user } = useContext(AuthContext);

  const [journals, setJournals] = useState([]);
  const [reflects, setReflects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("journal"); // "journal" | "reflect"

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const journalRes = await api.get("/api/journal/history/");
      setJournals(journalRes.data);
    } catch (error) {
      console.log("Failed to load journal history:", error.message);
    }

    try {
      const reflectRes = await api.get("/api/reflect/history/");
      setReflects(reflectRes.data);
    } catch (error) {
      console.log("Failed to load reflect history:", error.message);
      // reflect endpoint may not be deployed yet — silently skip
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const totalEntries = journals.length + reflects.length;

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
      {/* ── User Info Card ── */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={64} color={colors.primary} />
        </View>
        <Text style={[typography.title, styles.username]}>
          {user?.username || "User"}
        </Text>
        <Text style={[typography.caption, styles.userEmail]}>
          {user?.email || ""}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[typography.title, styles.statNumber]}>{journals.length}</Text>
            <Text style={[typography.caption, styles.statLabel]}>Journals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[typography.title, styles.statNumber]}>{reflects.length}</Text>
            <Text style={[typography.caption, styles.statLabel]}>Reflections</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[typography.title, styles.statNumber]}>{totalEntries}</Text>
            <Text style={[typography.caption, styles.statLabel]}>Total</Text>
          </View>
        </View>
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* ── History Tab Toggle ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "journal" && styles.tabActive]}
          onPress={() => setActiveTab("journal")}
        >
          <Ionicons
            name="book-outline"
            size={16}
            color={activeTab === "journal" ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "journal" && styles.tabTextActive]}>
            Journals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "reflect" && styles.tabActive]}
          onPress={() => setActiveTab("reflect")}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={16}
            color={activeTab === "reflect" ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "reflect" && styles.tabTextActive]}>
            Reflections
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Journal History ── */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : activeTab === "journal" ? (
        journals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={colors.textMuted} />
            <Text style={[typography.body, styles.emptyText]}>No journal entries yet</Text>
          </View>
        ) : (
          journals.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => navigation.navigate("EntryDetail", { entry })}
            >
              <View style={styles.entryHeader}>
                <View style={styles.emotionPill}>
                  <Text style={styles.emotionText}>
                    {entry.dominant_emotion
                      ? entry.dominant_emotion.charAt(0).toUpperCase() +
                        entry.dominant_emotion.slice(1)
                      : "—"}
                  </Text>
                </View>
                <Text style={[typography.caption, styles.date]}>
                  {formatDate(entry.created_at)}
                </Text>
              </View>
              <Text style={[typography.body, styles.entryPreview]} numberOfLines={2}>
                {entry.text}
              </Text>
            </TouchableOpacity>
          ))
        )
      ) : (
        /* ── Reflect History ── */
        reflects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={[typography.body, styles.emptyText]}>No reflections yet</Text>
            <Text style={[typography.caption, styles.emptySubtext]}>
              Tap Reflect on the Journal tab to start
            </Text>
          </View>
        ) : (
          reflects.map((session) => (
            <View key={session.id} style={styles.reflectCard}>
              <View style={styles.entryHeader}>
                <View style={styles.reflectBadge}>
                  <Ionicons name="chatbubbles-outline" size={12} color={colors.primary} />
                  <Text style={styles.reflectBadgeText}>Reflection</Text>
                </View>
                <Text style={[typography.caption, styles.date]}>
                  {formatDate(session.created_at)}
                </Text>
              </View>

              <Text style={[typography.body, styles.entryPreview]} numberOfLines={2}>
                {session.preview || "—"}
              </Text>

              {/* Arc row */}
              {session.arc_summary && (
                <View style={styles.arcRow}>
                  <Ionicons
                    name={ARC_ICONS[session.arc_type] || "analytics-outline"}
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={[typography.caption, styles.arcText]}>
                    {session.arc_summary}
                  </Text>
                </View>
              )}

              <Text style={[typography.caption, styles.messageCount]}>
                {session.message_count} {session.message_count === 1 ? "exchange" : "exchanges"}
              </Text>
            </View>
          ))
        )
      )}
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },

  // ── Profile Card ──
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: "center",
    ...elevation.card,
  },
  avatarContainer: { marginBottom: spacing.md },
  username: { color: colors.textPrimary, marginBottom: spacing.xs },
  userEmail: { color: colors.textSecondary, marginBottom: spacing.lg },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: spacing.sm,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { color: colors.primary },
  statLabel: { color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },

  // ── Logout ──
  logoutButton: {
    backgroundColor: colors.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: typography.body.fontSize },

  // ── Tabs ──
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.lg,
    ...elevation.card,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  tabActive: { backgroundColor: colors.primarySoft },
  tabText: { fontSize: 14, fontWeight: "500", color: colors.textSecondary },
  tabTextActive: { color: colors.primary },

  loader: { marginTop: spacing.xl },
  emptyState: { alignItems: "center", paddingVertical: spacing.xl * 2 },
  emptyText: { color: colors.textMuted, marginTop: spacing.md },
  emptySubtext: { color: colors.textMuted, marginTop: spacing.xs },

  // ── Journal Entry Card ──
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...elevation.card,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  emotionPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 99,
  },
  emotionText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  date: { color: colors.textMuted },
  entryPreview: { color: colors.textSecondary, lineHeight: 20 },

  // ── Reflect Session Card ──
  reflectCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    ...elevation.card,
  },
  reflectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 99,
  },
  reflectBadgeText: { color: colors.primary, fontSize: 11, fontWeight: "600" },
  arcRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  arcText: { color: colors.textSecondary },
  messageCount: { color: colors.textMuted, marginTop: spacing.xs },
});