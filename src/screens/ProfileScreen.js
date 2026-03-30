import React, { useContext, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
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

const EMOTION_COLORS = {
  joy:      "#F5A623",
  sadness:  "#4A6FD4",
  anger:    "#D94040",
  fear:     "#8B44C4",
  disgust:  "#3DAA5C",
  surprise: "#D4A017",
  neutral:  "#8A8A8A",
};

function getEmotionColor(emotion) {
  return EMOTION_COLORS[emotion?.toLowerCase()] || WARM.accent;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProfileScreen({ navigation }) {
  const { logout, user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHistory();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.get("/api/journal/history/");
      setHistory(response.data);
    } catch (error) {
      console.log("Failed to load history:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const totalEntries = history.length;
  const thisWeek = history.filter(e => {
    const diff = new Date() - new Date(e.created_at);
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const dominantEmotion = history.length > 0
    ? Object.entries(
        history.reduce((acc, e) => {
          if (e.dominant_emotion) acc[e.dominant_emotion] = (acc[e.dominant_emotion] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

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
        <Text style={styles.screenTitle}>Your Profile</Text>
        <Text style={styles.screenSubtitle}>Your journaling journey</Text>
        <View style={styles.headerDivider} />
      </Animated.View>

      {/* User card */}
      <Animated.View style={[styles.userCard, { opacity: fadeAnim }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(user?.username || "U")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username || "User"}</Text>
        <Text style={styles.userEmail}>{user?.email || ""}</Text>
      </Animated.View>

      {/* Stats row */}
      {!loading && (
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalEntries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            {dominantEmotion ? (
              <View style={[styles.dominantDot, { backgroundColor: getEmotionColor(dominantEmotion) }]} />
            ) : (
              <Text style={styles.statNumber}>—</Text>
            )}
            <Text style={styles.statLabel}>
              {dominantEmotion
                ? dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1)
                : "No data"}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Logout */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* History section */}
      <Animated.View style={[styles.sectionHeader, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Journal History</Text>
        <Text style={styles.sectionCount}>
          {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
        </Text>
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={WARM.accent} style={styles.loader} />
      ) : history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color={WARM.textMuted} />
          <Text style={styles.emptyText}>No journal entries yet</Text>
        </View>
      ) : (
        history.map((entry) => {
          const emotionColor = getEmotionColor(entry.dominant_emotion);
          return (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => navigation.navigate("EntryDetail", { entry })}
              activeOpacity={0.85}
            >
              <View style={styles.entryHeader}>
                {/* EMOTION PILL */}
                <View style={[
                  styles.emotionPill,
                  { backgroundColor: emotionColor + "35" }
                ]}>
                  <View style={[styles.emotionDot, { backgroundColor: emotionColor }]} />
                  <Text style={[styles.emotionLabel, { color: emotionColor }]}>
                    {entry.dominant_emotion
                      ? entry.dominant_emotion.charAt(0).toUpperCase() + entry.dominant_emotion.slice(1)
                      : "Unknown"}
                  </Text>
                </View>
                <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
              </View>
              <Text style={styles.entryPreview} numberOfLines={2}>
                {entry.text}
              </Text>
            </TouchableOpacity>
          );
        })
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
  userCard: {
    backgroundColor: WARM.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: WARM.border,
    marginBottom: 16,
    shadowColor: "#C17B4E",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: WARM.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: WARM.accent,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: WARM.accent,
  },
  username: {
    fontSize: 20,
    fontWeight: "700",
    color: WARM.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: WARM.textMuted,
  },
  statsRow: {
    backgroundColor: WARM.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: WARM.border,
    marginBottom: 16,
    shadowColor: "#C17B4E",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: WARM.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: WARM.textMuted,
    textAlign: "center",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: WARM.border,
  },
  dominantDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  logoutButton: {
    backgroundColor: WARM.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 28,
    gap: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: WARM.textPrimary,
  },
  sectionCount: {
    fontSize: 12,
    color: WARM.textMuted,
    fontWeight: "500",
  },
  loader: {
    marginTop: 32,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    color: WARM.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  entryCard: {
    backgroundColor: WARM.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: WARM.border,
    shadowColor: "#C17B4E",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  emotionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  emotionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  entryDate: {
    fontSize: 12,
    color: WARM.textMuted,
  },
  entryPreview: {
    fontSize: 13,
    color: WARM.textSecondary,
    lineHeight: 20,
  },
});