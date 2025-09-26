// AICoachPanel.tsx
// Modular AI Coach Panel: offers personalized tips, encouragement, and next steps based on analytics
import React from "react";

interface AICoachPanelProps {
  eqScore?: number;
  sentiment?: string;
  archetype?: string;
}

const getCoachMessage = (eqScore?: number, sentiment?: string, archetype?: string) => {
  if (!eqScore && !sentiment && !archetype) return "Your AI Coach will provide feedback as you answer questions.";
  let msg = "";
  if (eqScore !== undefined) {
    if (eqScore > 70) msg += "Your EQ score is excellent. Keep leveraging your emotional intelligence! ";
    else if (eqScore > 40) msg += "Your EQ score is solid. Consider reflecting on your responses for even more impact. ";
    else msg += "There's room to grow your EQ. Try to be more expressive and reflective in your answers. ";
  }
  if (sentiment) {
    if (sentiment === "Positive") msg += "Your answers show positivity—great for team roles. ";
    else if (sentiment === "Negative") msg += "Try to keep your responses constructive and forward-looking. ";
    else msg += "Neutral tone detected. Adding a bit more enthusiasm can help! ";
  }
  if (archetype) {
    msg += `Your archetype, ${archetype}, suggests you excel in certain roles. Highlight those strengths!`;
  }
  return msg.trim();
};

const AICoachPanel: React.FC<AICoachPanelProps> = ({ eqScore, sentiment, archetype }) => {
  const message = getCoachMessage(eqScore, sentiment, archetype);
  return (
    <div style={{
      background: '#22223b',
      color: '#fff',
      borderRadius: 14,
      padding: '1.5rem',
      margin: '2rem 0',
      boxShadow: '0 0 16px #7f5cff33',
      maxWidth: 480,
      fontSize: 18,
      fontWeight: 500,
      lineHeight: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      position: 'relative',
      animation: 'fade-in 0.7s',
    }}>
      <span style={{ fontSize: 28, color: '#00fff7' }}>🤖</span>
      <span>{message}</span>
    </div>
  );
};

export default AICoachPanel;
