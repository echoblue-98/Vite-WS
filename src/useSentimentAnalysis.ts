import { useState } from "react";
import { fetchSentiment } from "./api";

// useSentimentAnalysis: Uses backend for real sentiment analysis
export function useSentimentAnalysis() {
  const [sentiment, setSentiment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function analyze(text: string) {
    setLoading(true);
    setError("");
    try {
      const result = await fetchSentiment(text);
      setSentiment(result);
    } catch (e: any) {
      setError("Sentiment analysis failed");
      setSentiment("");
    } finally {
      setLoading(false);
    }
  }

  return { sentiment, loading, error, analyze };
}
