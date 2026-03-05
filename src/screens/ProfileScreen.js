// ProfileScreen.js - User profile with logout and history
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

const ProfileScreen = ({ navigation }) => {
  const { logout, user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.get("/api/journal/history/");
      setHistory(response.data);
    } catch (error) {
      console.log("Failed to load history:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
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
      {/* User Info Card */}
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
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* History Section */}
      <View style={styles.sectionHeader}>
        <Text style={[typography.section, styles.sectionTitle]}>
          Journal History
        </Text>
        <Text style={[typography.caption, styles.entryCount]}>
          {history.length} {history.length === 1 ? "entry" : "entries"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          <Text style={[typography.body, styles.emptyText]}>
            No journal entries yet
          </Text>
        </View>
      ) : (
        history.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={styles.entryCard}
            onPress={() => navigation.navigate("EntryDetail", { entry })}
          >
            <View style={styles.entryHeader}>
              <Text style={[typography.body, styles.emotion]}>
                {entry.dominant_emotion
                  ? entry.dominant_emotion.charAt(0).toUpperCase() +
                    entry.dominant_emotion.slice(1)
                  : "Unknown"}
              </Text>
              <Text style={[typography.caption, styles.date]}>
                {formatDate(entry.created_at)}
              </Text>
            </View>
            <Text style={[typography.body, styles.entryPreview]} numberOfLines={2}>
              {entry.text}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: "center",
    ...elevation.card,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  username: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    color: colors.textSecondary,
  },
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
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
  },
  entryCount: {
    color: colors.textSecondary,
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
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
    marginBottom: spacing.sm,
  },
  emotion: {
    color: colors.primary,
    fontWeight: "600",
  },
  date: {
    color: colors.textMuted,
  },
  entryPreview: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
});