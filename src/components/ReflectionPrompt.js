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
      const response = await api.post("/api/journal/reflect/question/", {
        journal_text: journalText,
        dominant_emotion: dominantEmotion,
      });
      setQuestion(response.data.question);
      setPhase("question");
    } catch (error) {
      console.log("Failed to generate question:", error);
      // Use fallback instead of dismissing — don't punish user for network issues
      setQuestion("What felt most significant about what you wrote?");
      setPhase("question");
    }
  };

  const generateFollowUp = async () => {
    try {
      const response = await api.post("/api/journal/reflect/closing/", {
        journal_text: journalText,
        question,
        answer,
      });
      setFollowUp(response.data.closing);
    } catch (error) {
      setFollowUp("Thank you for going deeper. That took courage.");
    }
    setPhase("done");
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