// ReflectScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../service/api";

import { colors } from "../theme/colors";
import { spacing, radius, elevation } from "../theme/tokens";
import { typography } from "../theme/typography";

export default function ReflectScreen({ navigation }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);   // initial session start
  const [sending, setSending] = useState(false);   // message in flight
  const [ending, setEnding] = useState(false);     // session ending

  const flatListRef = useRef(null);

  // ── Start session on mount ──
  useEffect(() => {
    startSession();
  }, []);

  // ── Auto-scroll to bottom on new message ──
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const startSession = async () => {
    try {
      const response = await api.post("/api/reflect/start/");
      const { session_id, question } = response.data;

      setSessionId(session_id);
      setMessages([{ id: "open", role: "assistant", content: question }]);
    } catch (error) {
      Alert.alert(
        "Couldn't Start Reflection",
        "Please check your connection and try again.",
        [{ text: "Go Back", onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !sessionId) return;

    // Optimistically add user message
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: "user", content: text }]);
    setInputText("");
    setSending(true);

    // Add typing indicator
    const typingId = `typing_${Date.now()}`;
    setMessages(prev => [...prev, { id: typingId, role: "typing" }]);

    try {
      const response = await api.post("/api/reflect/message/", {
        session_id: sessionId,
        content: text,
      });

      const { question } = response.data;

      // Replace typing indicator with real response
      setMessages(prev => [
        ...prev.filter(m => m.id !== typingId),
        { id: `assistant_${Date.now()}`, role: "assistant", content: question },
      ]);
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      Alert.alert("Error", "Couldn't send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleEnd = async () => {
    if (!sessionId || ending) return;

    Alert.alert(
      "End Reflection",
      "Are you done for now?",
      [
        { text: "Keep Going", style: "cancel" },
        {
          text: "I'm Done",
          onPress: async () => {
            setEnding(true);
            try {
              const response = await api.post("/api/reflect/end/", {
                session_id: sessionId,
              });

              const { dominant_emotion, arc_summary } = response.data;

              navigation.replace("EmotionFeedback", {
                contextual_message: arc_summary || null,
                has_insights: true,
                crisis_flag: false,
                from_reflect: true,
                dominant_emotion,
              });
            } catch (error) {
              setEnding(false);
              Alert.alert("Error", "Couldn't end session. Please try again.");
            }
          },
        },
      ]
    );
  };

  // ── Render message bubble ──
  const renderMessage = ({ item }) => {
    if (item.role === "typing") {
      return (
        <View style={[styles.bubble, styles.assistantBubble]}>
          <TypingDots />
        </View>
      );
    }

    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.bubbleWrapper,
          isUser ? styles.userWrapper : styles.assistantWrapper,
        ]}
      >
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[typography.body, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.md }]}>
          Starting your reflection...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[typography.section, styles.headerTitle]}>Reflect</Text>
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEnd}
          disabled={ending}
        >
          {ending ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Text style={styles.endButtonText}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Message List ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Input Row ── */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Write your thoughts..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-up" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Animated typing indicator
function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );

    Animated.parallel([
      animate(dot1, 0),
      animate(dot2, 150),
      animate(dot3, 300),
    ]).start();
  }, []);

  const dotStyle = (anim) => ({
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
    marginHorizontal: 2,
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  endButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
  },
  endButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },

  // ── Messages ──
  messageList: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  bubbleWrapper: {
    marginBottom: spacing.md,
  },
  userWrapper: {
    alignItems: "flex-end",
  },
  assistantWrapper: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    ...elevation.card,
  },
  userText: {
    color: "#fff",
    lineHeight: 22,
  },
  assistantText: {
    color: colors.textPrimary,
    lineHeight: 22,
  },

  // ── Input ──
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 120,
    lineHeight: 22,
    ...elevation.card,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});