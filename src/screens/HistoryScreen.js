import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import api from "../service/api";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

export default function HistoryScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/journal/history/");
      setEntries(res.data);
    } catch (error) {
      console.log(
        "Failed to fetch history:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[typography.body, styles.emptyText]}>
          No entries yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={[typography.title, styles.title]}>
        History
      </Text>

      {entries.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={[typography.section, styles.emotion]}>
            {item.dominant_emotion
              ? item.dominant_emotion.charAt(0).toUpperCase() +
                item.dominant_emotion.slice(1)
              : "Unknown"}
          </Text>

          <Text
            style={[typography.body, styles.preview]}
            numberOfLines={3}
          >
            {item.text}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...elevation.card,
  },
  emotion: {
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  preview: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  emptyText: {
    color: colors.textSecondary,
  },
});