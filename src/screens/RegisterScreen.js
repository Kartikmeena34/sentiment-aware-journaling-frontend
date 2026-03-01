import React, { useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";
import PrimaryButton from "../components/PrimaryButton";
import { typography } from "../theme/typography";

const BASE_URL = "http://192.168.1.2:8000";

export default function RegisterScreen() {
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      await login(data.access, data.refresh);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.title}>Create Account</Text>

      <TextInput style={styles.input} placeholder="Username" onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} />

      <PrimaryButton title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  input: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginTop: 15 },
});