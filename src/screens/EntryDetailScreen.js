// EntryDetailScreen.js - Shows the full text of a journal entry along with its creation date. This screen is navigated to from the HistoryScreen when a user taps on an entry. It provides a clean, readable layout for reviewing past entries in detail.
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

const EntryDetailScreen = () => {
  const route = useRoute();
  const { entry } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={[typography.caption, styles.date]}>
          {new Date(entry.created_at).toLocaleString()}
        </Text>

        <Text style={[typography.body, styles.text]}>
          {entry.text}
        </Text>
      </View>
    </ScrollView>
  );
};

export default EntryDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...elevation.card,
  },
  date: {
    marginBottom: spacing.md,
    color: colors.textMuted,
  },
  text: {
    color: colors.textPrimary,
    lineHeight: 22,
  },
});