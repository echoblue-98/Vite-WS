import React, { useState } from "react";
import { useAppState } from "./context/AppStateContext";
import { useVoiceControl } from "./useVoiceControl";
import { fetchNextQuestion } from "./api";

// AdaptiveQuestion: suggests the next question based on analysis
interface AdaptiveQuestionProps {
  text?: string;
  sentiment?: string;
  eqScore?: number;
  emotionScores?: Record<string, number>;
  voiceFeatures?: Record<string, any>;
  onRespond?: (text: string, sentiment: string, eqScore: number | undefined) => void;
  onError?: (msg: string) => void;
  totalQuestions: number;
}

const AdaptiveQuestion: React.FC<AdaptiveQuestionProps> = ({ text, sentiment, eqScore, emotionScores, voiceFeatures, onRespond, onError, totalQuestions }) => {
  const { state, dispatch } = useAppState();
  const [loading, setLoading] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [nextQuestionText, setNextQuestionText] = useState<string | null>(null);

  // Combine response submission and next question selection
  const handleSubmitAndNext = async () => {
    setLoading(true);
    setShowAnim(false);
    try {
      // Use fetchNextQuestion as in the test mock
      const result = await fetchNextQuestion({
        text,
        sentiment,
        eq_score: eqScore,
        emotion_scores: emotionScores,
        voice_features: voiceFeatures
      });
      setShowAnim(true);
      setLoading(false);
      setNextQuestionText(result);
      dispatch({ type: 'SET_CURRENT_QUESTION', value: Math.min(state.currentQuestion + 1, totalQuestions - 1) });
      if (onRespond) onRespond(text || '', sentiment || '', eqScore);
    } catch {
      setLoading(false);
      dispatch({ type: 'SET_GLOBAL_ERROR', value: 'Next question fetch failed' });
      if (onError) onError('Next question fetch failed');
    }
  };

  // Voice commands: next, previous, repeat question
  useVoiceControl({
    plugins: [
      {
        commands: ['next question', 'previous question', 'repeat question'],
        onCommand: (cmd) => {
          if (cmd.includes('next')) {
            // Trigger same behavior as clicking Next
            if (!loading && (text || '').trim()) {
              handleSubmitAndNext();
            }
          } else if (cmd.includes('previous')) {
            // Go back one question
            dispatch({ type: 'SET_CURRENT_QUESTION', value: Math.max(state.currentQuestion - 1, 0) });
          } else if (cmd.includes('repeat')) {
            // Re-announce/animate current prompt
            setShowAnim(false);
            setTimeout(() => setShowAnim(true), 50);
          }
        },
      },
    ],
  });

  // Removed broken handleGetNext and unused JSX block
  return (
    <div style={{
      margin: '2rem auto',
      padding: '2rem',
      background: '#181f2b',
      borderRadius: 16,
      maxWidth: 540,
      boxShadow: '0 0 24px #00fff799',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24
    }}>
      <input
        data-testid="adaptive-question-input"
        value={text || ''}
        onChange={e => dispatch({ type: 'SET_VOICE_TRANSCRIPT', value: e.target.value })}
        style={{
          marginBottom: 16,
          padding: '0.7em 1.2em',
          fontSize: 18,
          borderRadius: 8,
          border: '1px solid #00fff7',
          background: '#222',
          color: '#fff',
          width: '100%',
        }}
        placeholder="Type or speak your response..."
      />
      <button
        type="button"
        role="button"
        aria-label="Get Next Question"
        data-testid="adaptive-question-next"
        onClick={handleSubmitAndNext}
        disabled={loading || !text?.trim()}
        style={{
          padding: '0.8em 2em',
          borderRadius: 12,
          border: 'none',
          background: loading ? '#444' : '#00fff7',
          color: loading ? '#aaa' : '#222',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 18,
          boxShadow: '0 0 16px #00fff7',
          marginTop: 12,
          letterSpacing: 1,
          transition: 'background 0.2s, color 0.2s',
        }}
        tabIndex={0}
        autoFocus
      >
        {loading ? 'Submitting...' : 'Next'}
      </button>
      <button
        type="button"
        role="button"
        aria-label="Go to previous question"
        data-testid="adaptive-question-prev"
        onClick={() => dispatch({ type: 'SET_CURRENT_QUESTION', value: Math.max(state.currentQuestion - 1, 0) })}
        disabled={state.currentQuestion === 0}
        style={{
          padding: '0.8em 2em',
          borderRadius: 12,
          border: 'none',
          background: '#7f5cff',
          color: '#fff',
          fontWeight: 'bold',
          cursor: state.currentQuestion === 0 ? 'not-allowed' : 'pointer',
          fontSize: 18,
          boxShadow: '0 0 16px #7f5cff',
          marginTop: 12,
          letterSpacing: 1,
          transition: 'background 0.2s, color 0.2s',
        }}
        tabIndex={0}
      >
        Previous
      </button>
      {showAnim && (
        <div
          style={{
            marginTop: 12,
            color: '#7f5cff',
            fontWeight: 600,
            opacity: showAnim ? 1 : 0,
            transform: showAnim ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.5s, transform 0.5s',
          }}
        >
          Advanced to next question!
        </div>
      )}
      {nextQuestionText && (
        <div data-testid="next-question-text" style={{ marginTop: 16, color: '#00fff7', fontWeight: 'bold' }}>
          {nextQuestionText}
        </div>
      )}
    </div>
  );
}

export { AdaptiveQuestion };
