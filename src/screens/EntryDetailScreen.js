import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";

const WARM = {
  bg: "#FDF6EC",
  surface: "#FFFDF9",
  accent: "#C17B4E",
  textPrimary: "#2D1B0E",
  textSecondary: "#7A5C44",
  textMuted: "#B09880",
  border: "#EDE0D0",
};

const EMOTION_COLORS = {
  joy:      "#F5A623",
  sadness:  "#4A6FD4",
  anger:    "#D94040",
  fear:     "#8B44C4",
  disgust:  "#3DAA5C",
  surprise: "#D4A017",
  neutral:  "#8A8A8A",
};

const EMOTION_EMOJIS = {
  joy:      "😊",
  sadness:  "😔",
  anger:    "😠",
  fear:     "😰",
  disgust:  "🤮",
  surprise: "😲",
  neutral:  "😐",
};

function getEmotionColor(emotion) {
  return EMOTION_COLORS[emotion?.toLowerCase()] || WARM.accent;
}

function getEmotionEmoji(emotion) {
  return EMOTION_EMOJIS[emotion?.toLowerCase()] || "📝";
}

export default function EntryDetailScreen() {
  const route = useRoute();
  const { entry } = route.params;
  const emotionColor = getEmotionColor(entry.dominant_emotion);
  const emotionEmoji = getEmotionEmoji(entry.dominant_emotion);
  const emotionName = entry.dominant_emotion
    ? entry.dominant_emotion.charAt(0).toUpperCase() + entry.dominant_emotion.slice(1)
    : "Unknown";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Journal Entry</Text>
        <Text style={styles.date}>
          {new Date(entry.created_at).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        <Text style={styles.time}>
          {new Date(entry.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <View style={styles.headerDivider} />
      </View>

      {/* Emoji stamp */}
      <View style={styles.emojiStampContainer}>
        {/* Outer ring — handles border only */}
        <View style={[styles.emojiRing, { borderColor: emotionColor }]}>
          {/* Inner circle — handles shadow only */}
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiText}>{emotionEmoji}</Text>
          </View>
        </View>
        <Text style={[styles.emotionName, { color: emotionColor }]}>
          {emotionName}
        </Text>
        {entry.confidence && (
          <Text style={styles.confidenceText}>
            {Math.round(entry.confidence * 100)}% confidence
          </Text>
        )}
      </View>

      {/* Notebook card */}
      <View style={styles.card}>
        {/* Ruled lines */}
        <View style={styles.ruledLines}>
          {[...Array(20)].map((_, i) => (
            <View key={i} style={styles.ruledLine} />
          ))}
        </View>

        {/* Red margin line */}
        <View style={styles.marginLine} />

        {/* Entry text */}
        <View style={styles.textArea}>
          <Text style={styles.entryText}>{entry.text}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM.bg,
  },
  content: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: WARM.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  date: {
    fontSize: 14,
    color: WARM.textSecondary,
    fontWeight: "500",
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
    color: WARM.textMuted,
    marginBottom: 20,
  },
  headerDivider: {
    height: 2,
    width: 100,
    backgroundColor: WARM.accent,
    borderRadius: 2,
  },
  emojiStampContainer: {
    alignItems: "center",
    marginBottom: -28,
    zIndex: 10,
  },
  emojiRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  emojiCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: WARM.surface,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  emojiText: {
    fontSize: 45,
  },
  emotionName: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 11,
    color: WARM.textMuted,
    fontWeight: "700",
    marginBottom: 32,
  },
  card: {
    backgroundColor: WARM.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: WARM.border,
    shadowColor: "#C17B4E",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    minHeight: 320,
    position: "relative",
    overflow: "hidden",
  },
  ruledLines: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  ruledLine: {
    height: 1,
    backgroundColor: "#D6C9B8",
    opacity: 0.7,
  },
  marginLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 48,
    width: 1.5,
    backgroundColor: "#E8A0A0",
    opacity: 0.8,
  },
  textArea: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingLeft: 60,
    paddingRight: 20,
    zIndex: 1,
    minHeight: 320,
  },
  entryText: {
    fontSize: 16,
    color: WARM.textPrimary,
    lineHeight: 28,
    fontWeight: "400",
  },
});