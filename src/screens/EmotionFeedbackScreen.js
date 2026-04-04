import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
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
  success: "#6A9E7F",
};

const getNudgeMessage = (emotion) => {
  const nudges = {
    sadness: "Something's weighing on you. Want to explore it?",
    fear: "Something feels uncertain. Want to talk through it?",
    anger: "Something frustrated you. Want to unpack it?",
    disgust: "Something bothered you. Want to look closer?",
    surprise: "Something caught you off guard. Want to reflect on it?",
  };
  return nudges[emotion?.toLowerCase()] || null;
};

export default function EmotionFeedbackScreen({ route, navigation }) {
  const {
    contextual_message,
    has_insights,
    dominant_emotion,
    journal_id,
    journal_text,
  } = route.params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  const nudgeMessage = getNudgeMessage(dominant_emotion);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoDeeper = () => {
    navigation.navigate("GoDeeper", {
      journal_text,
      dominant_emotion,
      journal_id,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Checkmark */}
      <Animated.View
        style={[styles.checkContainer, { transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.checkOuter}>
          <View style={styles.checkInner}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
        </View>
        <Text style={styles.savedText}>Entry Saved</Text>
        <Text style={styles.savedSubtext}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </Animated.View>

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Contextual message */}
        {contextual_message && (
          <View style={styles.messageRow}>
            <Ionicons name="sparkles-outline" size={16} color={WARM.accent} />
            <Text style={styles.messageText}>{contextual_message}</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Insight hint */}
        <View style={styles.hintRow}>
          {has_insights ? (
            <>
              <Ionicons name="bulb-outline" size={16} color={WARM.success} />
              <Text style={[styles.hintText, { color: WARM.success }]}>
                New insights are ready — check the Insights tab
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="hourglass-outline" size={16} color={WARM.textMuted} />
              <Text style={styles.hintText}>
                Keep journaling to unlock insights
              </Text>
            </>
          )}
        </View>

        {/* Nudge — navigates to GoDeeper */}
        {nudgeMessage && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.nudgeContainer}
              onPress={handleGoDeeper}
              activeOpacity={0.85}
            >
              <Text style={styles.nudgeText}>{nudgeMessage}</Text>
              <Text style={styles.nudgeLink}>Go deeper →</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttonContainer, { opacity: buttonFade }]}>
        {nudgeMessage && (
          <TouchableOpacity
            style={styles.deeperButton}
            onPress={handleGoDeeper}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={WARM.accent} />
            <Text style={styles.deeperButtonText}>Go deeper</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate("Main", { screen: "Journal" })}
          activeOpacity={0.85}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM.bg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  checkContainer: {
    alignItems: "center",
    marginBottom: 8,
    marginTop: 48,
  },
  checkOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: WARM.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: WARM.accent + "40",
  },
  checkInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: WARM.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: WARM.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  savedText: {
    fontSize: 24,
    fontWeight: "800",
    color: WARM.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  savedSubtext: {
    fontSize: 13,
    color: WARM.textMuted,
    fontWeight: "400",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: WARM.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: WARM.border,
    shadowColor: "#C17B4E",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 24,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: WARM.accentSoft,
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: WARM.textSecondary,
    lineHeight: 21,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: WARM.border,
    marginVertical: 16,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    color: WARM.textMuted,
    flex: 1,
    lineHeight: 19,
  },
  nudgeContainer: {
    paddingVertical: 4,
  },
  nudgeText: {
    fontSize: 13,
    color: WARM.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  nudgeLink: {
    fontSize: 13,
    color: WARM.accent,
    fontWeight: "700",
  },
  buttonContainer: {
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  deeperButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: WARM.accentSoft,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WARM.accent + "40",
  },
  deeperButtonText: {
    color: WARM.accent,
    fontWeight: "700",
    fontSize: 15,
  },
  doneButton: {
    backgroundColor: WARM.accent,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: WARM.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  doneButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});