import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { typography } from "../theme/typography";

export default function TrendScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>Trends</Text>
      <Text>Emotional analytics will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
});