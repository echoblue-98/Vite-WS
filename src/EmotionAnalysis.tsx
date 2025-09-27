import React, { useState } from "react";
import { fetchEmotion } from "./api";

// EmotionAnalysis: displays backend-powered emotion scores for a text
interface EmotionAnalysisProps {
  text: string;
}

const EmotionAnalysis: React.FC<EmotionAnalysisProps> = ({ text }) => {
  const [scores, setScores] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchEmotion(text);
      setScores(result);
    } catch (e: any) {
      setError("Emotion analysis failed");
      setScores(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '1rem 0', padding: '1rem', background: '#181f2b', borderRadius: 12, maxWidth: 480 }}>
      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        style={{ padding: '0.5em 1em', borderRadius: 8, border: 'none', background: '#00fff7', color: '#222', fontWeight: 'bold', cursor: 'pointer' }}
      >
        {loading ? 'Analyzing Emotions...' : 'Analyze Emotions'}
      </button>
      {scores && (
        <div style={{ marginTop: 12, color: '#7f5cff', fontWeight: 600 }}>
          Emotions: {Object.entries(scores).map(([k, v]) => `${k}: ${v}`).join(", ")}
        </div>
      )}
      {error && (
        <div style={{ marginTop: 8, color: '#ff5c5c' }}>{error}</div>
      )}
    </div>
  );
};

export default EmotionAnalysis;
