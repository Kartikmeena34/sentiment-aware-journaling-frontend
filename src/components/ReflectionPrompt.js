import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const WARM = {
  bg: "#FDF6EC",
  surface: "#FFFDF9",
  accent: "#C17B4E",
  accentSoft: "#F5E6D3",
  textPrimary: "#2D1B0E",
  textSecondary: "#7A5C44",
  textMuted: "#B09880",
  border: "#EDE0D0",
};

export default function ReflectionPrompt({
  journalText,
  dominantEmotion,
  journalId,
  onSave,
  onDismiss,
}) {
  const [phase, setPhase] = useState("loading");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    generateQuestion();
  }, []);

  useEffect(() => {
    if (phase !== "loading") {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase]);

  const generateQuestion = async () => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a warm, empathetic journaling companion. Generate exactly ONE short, warm follow-up question based on the user's journal entry. The question should:
- Acknowledge what they actually wrote about specifically
- Invite them to reflect one layer deeper
- Feel like it came from a caring friend, not a therapist
- Be under 20 words
- NOT mention the emotion label directly
- NOT start with "I"
Return only the question, nothing else.`,
          messages: [
            {
              role: "user",
              content: `Journal entry: "${journalText}"\nDetected emotion: ${dominantEmotion}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const generatedQuestion = data.content[0].text.trim();
      setQuestion(generatedQuestion);
      setPhase("question");
    } catch (error) {
      console.log("Failed to generate question:", error);
      onDismiss();
    }
  };

  const generateFollowUp = async () => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a warm, empathetic journaling companion. The user answered a reflection question. Generate ONE short warm closing response that:
- Acknowledges what they said warmly and specifically
- Does NOT ask another question
- Feels like a gentle, human close
- Is under 20 words
Return only the response, nothing else.`,
          messages: [
            {
              role: "user",
              content: `Original journal: "${journalText}"\nReflection question: "${question}"\nUser answer: "${answer}"`,
            },
          ],
        }),
      });

      const data = await response.json();
      const closing = data.content[0].text.trim();
      setFollowUp(closing);
      setPhase("done");
    } catch (error) {
      setPhase("done");
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSaving(true);

    try {
      if (journalId) {
        await onSave(question, answer);
      }
    } catch (e) {
      console.log("Save failed:", e);
    }

    await generateFollowUp();
    setSaving(false);
  };

  if (phase === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={WARM.accent} />
        <Text style={styles.loadingText}>Thinking of something to ask...</Text>
      </View>
    );
  }

  if (phase === "done") {
    return (
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.closingText}>
          {followUp || "Thank you for going deeper. That took courage."}
        </Text>
        <TouchableOpacity onPress={onDismiss} style={styles.doneLink}>
          <Text style={styles.doneLinkText}>Close reflection</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.questionRow}>
        <View style={styles.questionDot} />
        <Text style={styles.questionText}>{question}</Text>
      </View>

      <TextInput
        style={styles.answerInput}
        placeholder="Write your thoughts..."
        placeholderTextColor={WARM.textMuted}
        value={answer}
        onChangeText={setAnswer}
        multiline
        autoFocus
        textAlignVertical="top"
      />

      <View style={styles.actions}>
        <TouchableOpacity onPress={onDismiss} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!answer.trim() || saving) && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!answer.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.sendText}>Send</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WARM.accentSoft,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: WARM.accent + "30",
  },
  loadingText: {
    fontSize: 13,
    color: WARM.textMuted,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  questionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: WARM.accent,
    marginTop: 6,
  },
  questionText: {
    fontSize: 15,
    color: WARM.textPrimary,
    lineHeight: 22,
    flex: 1,
    fontWeight: "500",
  },
  answerInput: {
    backgroundColor: WARM.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: WARM.textPrimary,
    lineHeight: 21,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: WARM.border,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 13,
    color: WARM.textMuted,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: WARM.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  closingText: {
    fontSize: 14,
    color: WARM.textSecondary,
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: 12,
  },
  doneLink: {
    alignSelf: "flex-end",
  },
  doneLinkText: {
    fontSize: 12,
    color: WARM.textMuted,
  },
});