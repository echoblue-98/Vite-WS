import React, { useState, useEffect, useRef } from "react";
import { useAppState } from "./context/AppStateContext";
import { fetchFeedback } from "./api";

// AdaptiveFeedback: displays backend-powered coaching/encouragement for a response
interface AdaptiveFeedbackProps {
  text: string;
  sentiment?: string;
  eqScore?: number;
  onError?: (msg: string) => void;
}

const AdaptiveFeedback: React.FC<AdaptiveFeedbackProps> = ({ text, sentiment, eqScore, onError }) => {
  const { state, dispatch } = useAppState();
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // Debounce feedback requests for real-time updates
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setFeedback("");
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      try {
        // Get candidate context from app state if available
        const candidateId = state?.candidateName;
        const emotionScores = state.responses?.[state.currentQuestion]?.emotion_scores;
        const voiceFeatures = state.responses?.[state.currentQuestion]?.voice_features;
        const result = await fetchFeedback(text, sentiment, eqScore, emotionScores, voiceFeatures, candidateId);
        setFeedback(result);
        setError("");
      } catch (e: any) {
        setError("Feedback fetch failed");
        setFeedback("");
        if (onError) onError("Feedback fetch failed");
        dispatch({ type: 'SET_GLOBAL_ERROR', value: 'Feedback fetch failed' });
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, sentiment, eqScore, state.currentQuestion]);

  // Onboarding placeholder
  const showOnboarding = !text.trim();

  // TTS: play feedback aloud (keyboard accessible)
  const speakFeedback = () => {
    if (feedback && 'speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(feedback);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  // Animate feedback reveal
  const [showAnim, setShowAnim] = useState(false);
  useEffect(() => {
    if (feedback && !loading) {
      setShowAnim(false);
      setTimeout(() => setShowAnim(true), 30);
    } else {
      setShowAnim(false);
    }
  }, [feedback, loading]);

  // Tooltip state for TTS button
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{
        margin: '2.5rem auto',
        padding: '2.5rem 2rem',
        background: 'linear-gradient(135deg, #22223b 60%, #2a2a4d 100%)',
        borderRadius: 20,
        maxWidth: 600,
        boxShadow: '0 8px 32px #7f5cff99',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 22,
        border: '2px solid #ffd700',
        position: 'relative',
      }}
      aria-live="polite"
      aria-label="Adaptive Feedback Panel"
      tabIndex={0}
    >
      <div style={{ position: 'absolute', top: 8, right: 16, color: '#ffd700', fontWeight: 700, fontSize: 13, letterSpacing: 1, opacity: 0.8 }} aria-label="EchoWorks AI proprietary feedback">EchoWorks AI</div>
      {loading && (
        <div style={{ color: '#00fff7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, fontSize: 18 }} aria-live="polite" aria-busy="true">
          <span className="loader" aria-label="Loading feedback" style={{ width: 22, height: 22, borderRadius: '50%', border: '4px solid #00fff7', borderTop: '4px solid #181f2b', animation: 'spin 1s linear infinite' }} />
          <span style={{ letterSpacing: 0.5 }}>Getting Feedback...</span>
        </div>
      )}
      {feedback && !loading && (
        <div
          style={{
            marginTop: 16,
            color: '#7f5cff',
            fontWeight: 800,
            fontSize: 22,
            opacity: showAnim ? 1 : 0,
            transform: showAnim ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.6s, transform 0.6s',
            textAlign: 'center',
            letterSpacing: 0.7,
            lineHeight: 1.5,
            borderBottom: '2px solid #ffd700',
            paddingBottom: 10,
            borderRadius: 8,
            background: 'rgba(127,92,255,0.07)',
            boxShadow: '0 2px 12px #ffd70033',
          }}
          aria-live="polite"
          tabIndex={0}
        >
          {feedback}
        </div>
      )}
      {error && (
        <div style={{ marginTop: 8, color: '#ff5c5c', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-label="Error" role="alert">⚠️</span>
          <span>{error}</span>
          <span
            style={{
              background: '#222',
              color: '#ffd700',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 12,
              marginLeft: 8,
            }}
            role="tooltip"
          >Check your connection or try again</span>
        </div>
      )}
      {/* Loader animation keyframes */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdaptiveFeedback;
