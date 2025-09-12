import { useState } from "react";

// Simple sentiment analysis using a keyword approach (for demo)
export function useSentimentAnalysis() {
  const [sentiment, setSentiment] = useState<string>("");
  const [emotion, setEmotion] = useState<string>("");

  function analyze(text: string) {
    // Basic keyword-based sentiment/emotion (replace with real AI API for production)
    const positive = ["good", "great", "happy", "excited", "love", "enjoy", "success", "proud"];
    const negative = ["bad", "sad", "difficult", "challenge", "problem", "fail", "stress", "tough"];
    const energetic = ["excited", "energy", "passion", "drive", "motivate", "enthusiastic"];
    const calm = ["calm", "steady", "relaxed", "peaceful", "composed"];
    let score = 0;
    let emo = "Neutral";
    const lower = text.toLowerCase();
    if (positive.some(w => lower.includes(w))) score++;
    if (negative.some(w => lower.includes(w))) score--;
    if (energetic.some(w => lower.includes(w))) emo = "Energetic";
    if (calm.some(w => lower.includes(w))) emo = "Calm";
    setSentiment(score > 0 ? "Positive" : score < 0 ? "Negative" : "Neutral");
    setEmotion(emo);
  }

  return { sentiment, emotion, analyze };
}
