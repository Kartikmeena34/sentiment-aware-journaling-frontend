import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import api from "../service/api";
import { typography } from "../theme/typography";

export default function HistoryScreen() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const res = await api.get("/api/journal/history/");
    setEntries(res.data);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.title}>History</Text>

      {entries.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={typography.subtitle}>{item.dominant_emotion}</Text>
          <Text>{item.text.slice(0, 80)}...</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 16, marginTop: 15 },
});