// src/utils/intimacy.js

/**
 * Returns the intimacy level based on total journal + reflect entry count.
 * Used to progressively warm the app's tone as the user journals more.
 *
 * "new"      → entries 1-5   : neutral, supportive
 * "familiar" → entries 6-15  : warmer, more personal
 * "close"    → entries 16+   : genuine warmth
 */
export function getIntimacyLevel(entryCount = 0) {
  if (entryCount <= 5) return "new";
  if (entryCount <= 15) return "familiar";
  return "close";
}

/**
 * Returns a time-aware greeting that scales with intimacy level.
 */
export function getGreeting(entryCount = 0) {
  const level = getIntimacyLevel(entryCount);
  const hour = new Date().getHours();

  const timeOfDay =
    hour < 12 ? "morning" :
    hour < 17 ? "afternoon" :
    hour < 21 ? "evening" : "night";

  const greetings = {
    new: {
      morning: "Good morning.",
      afternoon: "Good afternoon.",
      evening: "Good evening.",
      night: "Still up?",
    },
    familiar: {
      morning: "Good morning. Ready to write?",
      afternoon: "Good afternoon. How's your day going?",
      evening: "Good evening. How was your day?",
      night: "It's late. How are you?",
    },
    close: {
      morning: "Good morning. Your journal is waiting.",
      afternoon: "Good afternoon. Something on your mind?",
      evening: "Good evening. Take a moment for yourself.",
      night: "Still up. What's with you tonight?",
    },
  };

  return greetings[level][timeOfDay];
}

/**
 * Returns the EmotionFeedback screen message tone based on intimacy level.
 */
export function getFeedbackHint(entryCount = 0, hasInsights = false) {
  const level = getIntimacyLevel(entryCount);

  if (hasInsights) {
    const insightHints = {
      new: "Check your Insights tab to discover patterns.",
      familiar: "Your Insights tab has something for you.",
      close: "Head to Insights — there's a pattern worth seeing.",
    };
    return insightHints[level];
  }

  const progressHints = {
    new: "Keep journaling to unlock insights.",
    familiar: "A few more entries and your insights will update.",
    close: "Keep going — your patterns are coming into focus.",
  };
  return progressHints[level];
}