import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  SafeAreaView,
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

let messageIdCounter = 0;
const makeId = () => `msg_${++messageIdCounter}_${Date.now()}`;

export default function GoDeepScreen({ route, navigation }) {
  const { journal_text, dominant_emotion, journal_id } = route.params;

  // messages: array of { id, role: "context"|"ai"|"user"|"typing", text }
  const [messages, setMessages] = useState([]);
  // groqHistory: array of { role: "user"|"assistant", content } — sent to backend each turn
  const [groqHistory, setGroqHistory] = useState([]);
  const [input, setInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [done, setDone] = useState(false);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    startChat();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const appendMessage = (role, text) => {
    const msg = { id: makeId(), role, text };
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
    return msg;
  };

  const startChat = async () => {
    // Show journal as context card at top
    appendMessage("context", journal_text);

    setAiTyping(true);

    try {
      const response = await api.post("/api/journal/reflect/chat/", {
        journal_text,
        dominant_emotion,
        conversation_history: [],
      });

      const reply = response.data.reply;
      appendMessage("ai", reply);

      // Add opening AI message to groq history
      setGroqHistory([{ role: "assistant", content: reply }]);
    } catch (e) {
      appendMessage("ai", "What felt most significant about what you wrote?");
      setGroqHistory([{
        role: "assistant",
        content: "What felt most significant about what you wrote?",
      }]);
    }

    setAiTyping(false);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleSend = async () => {
    if (!input.trim() || aiTyping || done) return;

    const userText = input.trim();
    setInput("");

    // Add user message to UI
    appendMessage("user", userText);

    // Build updated groq history with user message appended
    const updatedHistory = [
      ...groqHistory,
      { role: "user", content: userText },
    ];

    setGroqHistory(updatedHistory);
    setAiTyping(true);

    try {
      const response = await api.post("/api/journal/reflect/chat/", {
        journal_text,
        dominant_emotion,
        conversation_history: updatedHistory,
      });

      const reply = response.data.reply;
      appendMessage("ai", reply);

      // Append AI reply to history
      setGroqHistory([...updatedHistory, { role: "assistant", content: reply }]);
    } catch (e) {
      appendMessage("ai", "Tell me more about that.");
      setGroqHistory([
        ...updatedHistory,
        { role: "assistant", content: "Tell me more about that." },
      ]);
    }

    setAiTyping(false);
  };

  const handleDone = async () => {
    // Save full conversation to backend before leaving
    if (journal_id && groqHistory.length > 0) {
      try {
        await api.post("/api/journal/reflect/save/", {
          journal_id,
          conversation: groqHistory,
        });
      } catch (e) {
        console.log("Save failed:", e);
      }
    }
    navigation.navigate("Main", { screen: "Journal" });
  };

  const renderMessage = ({ item }) => {
    if (item.role === "context") {
      return (
        <View style={styles.contextBubble}>
          <Text style={styles.contextLabel}>YOU WROTE</Text>
          <Text style={styles.contextText}>{item.text}</Text>
        </View>
      );
    }

    if (item.role === "ai") {
      return (
        <View style={styles.aiRow}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>M</Text>
          </View>
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    if (item.role === "user") {
      return (
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={WARM.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Go Deeper</Text>
        <TouchableOpacity onPress={handleDone} style={styles.doneHeaderButton}>
          <Text style={styles.doneHeaderText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* Typing indicator */}
      {aiTyping && (
        <View style={styles.typingRow}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>M</Text>
          </View>
          <View style={styles.typingBubble}>
            <TypingDots />
          </View>
        </View>
      )}

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder={done ? "Reflection complete" : "Reply..."}
            placeholderTextColor={WARM.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!aiTyping && !done}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || aiTyping || done) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || aiTyping || done}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TypingDots() {
  const [frame, setFrame] = useState(0);
  const frames = ["●○○", "○●○", "○○●"];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return <Text style={styles.typingText}>{frames[frame]}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: WARM.border,
    backgroundColor: WARM.surface,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: WARM.textPrimary,
    letterSpacing: 0.2,
  },
  doneHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: WARM.accentSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: WARM.accent + "40",
  },
  doneHeaderText: {
    fontSize: 13,
    color: WARM.accent,
    fontWeight: "600",
  },
  messageList: {
    padding: 16,
    paddingBottom: 12,
    gap: 10,
  },
  contextBubble: {
    backgroundColor: WARM.accentSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: WARM.accent + "25",
  },
  contextLabel: {
    fontSize: 10,
    color: WARM.accent,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  contextText: {
    fontSize: 14,
    color: WARM.textSecondary,
    lineHeight: 22,
    fontStyle: "italic",
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: WARM.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  aiAvatarText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },
  aiBubble: {
    backgroundColor: WARM.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "78%",
    borderWidth: 1,
    borderColor: WARM.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  aiText: {
    fontSize: 15,
    color: WARM.textPrimary,
    lineHeight: 22,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  userBubble: {
    backgroundColor: WARM.accent,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "78%",
    shadowColor: WARM.accent,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  userText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    backgroundColor: WARM.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: WARM.border,
  },
  typingText: {
    fontSize: 13,
    color: WARM.textMuted,
    letterSpacing: 3,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: WARM.border,
    backgroundColor: WARM.surface,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: WARM.bg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: WARM.textPrimary,
    lineHeight: 22,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: WARM.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WARM.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: WARM.accent,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.35,
    elevation: 0,
  },
});