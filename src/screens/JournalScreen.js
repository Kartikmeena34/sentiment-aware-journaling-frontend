import React, { useState, useContext } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";
import PrimaryButton from "../components/PrimaryButton";
import api from "../service/api";
import { typography } from "../theme/typography";

export default function JournalScreen() {
  const { logout } = useContext(AuthContext);

  const [journalText, setJournalText] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    const response = await api.post("/api/journal/create/", {
      text: journalText,
    });
    setResult(response.data);
    setJournalText("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.title}>Journal</Text>

      <TextInput
        style={styles.input}
        multiline
        placeholder="How are you feeling?"
        value={journalText}
        onChangeText={setJournalText}
      />

      <PrimaryButton title="Submit" onPress={handleSubmit} />

      {result && (
        <View style={styles.card}>
          <Text style={typography.subtitle}>{result.dominant_emotion}</Text>
          <Text>{result.insight}</Text>
        </View>
      )}

      <PrimaryButton title="Logout" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  input: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginTop: 20 },
  card: { marginTop: 30, backgroundColor: "#fff", padding: 20, borderRadius: 16 },
});