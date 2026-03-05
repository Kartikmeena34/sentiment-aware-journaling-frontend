// HistoryScreen.js - Displays a list of past journal entries with their creation dates. Each entry is shown as a card with a preview of the text. Users can tap on an entry to view its full details on a separate screen. The screen also includes pull-to-refresh functionality to update the list of entries.
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../service/api";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

const HistoryScreen = () => {
  const navigation = useNavigation();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get("/api/journal/history/");
      setEntries(response.data);
    } catch (error) {
      console.log(
        "Failed to load history:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get("/api/journal/history/");
      setEntries(response.data);
    } catch (error) {
      console.log(
        "Refresh failed:",
        error.response?.data || error.message
      );
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!entries.length) {
    return (
      <View style={styles.center}>
        <Text style={[typography.body, styles.emptyText]}>
          Your journey begins here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={entries}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate("EntryDetail", { entry: item })
          }
        >
          <Text style={[typography.caption, styles.date]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>

          <Text
            style={[typography.body, styles.preview]}
            numberOfLines={3}
          >
            {item.text}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
};

export default HistoryScreen;

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
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...elevation.card,
  },
  date: {
    marginBottom: spacing.sm,
    color: colors.textMuted,
  },
  preview: {
    color: colors.textPrimary,
  },
});