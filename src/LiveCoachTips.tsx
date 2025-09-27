// LiveCoachTips.tsx
// Real-time, context-aware AI coach for EQ interviews
import React from "react";

interface LiveCoachTipsProps {
  eqScore?: number;
  sentiment?: string;
  energy?: number;
  tonality?: number;
}

function getLiveTip(eqScore?: number, sentiment?: string, energy?: number, tonality?: number) {
  if (eqScore !== undefined && eqScore < 40) return "Try to be more expressive and reflective in your answers.";
  if (sentiment === "Negative") return "Keep your responses constructive and forward-looking.";
  if (sentiment === "Positive") return "Great positivity—keep it up!";
  if (energy !== undefined && energy < 0.3) return "Try to speak a bit louder and with more energy.";
  if (tonality !== undefined && tonality > 0.7) return "Excellent vocal variety!";
  return "You're doing well. Stay authentic and keep going!";
}

const LiveCoachTips: React.FC<LiveCoachTipsProps> = ({ eqScore, sentiment, energy, tonality }) => {
  const tip = getLiveTip(eqScore, sentiment, energy, tonality);
  return (
    <div style={{
      background: '#181f2b',
      color: '#00fff7',
      borderRadius: 10,
      padding: '0.75rem 1.25rem',
      margin: '1.5rem 0',
      fontSize: 16,
      fontWeight: 500,
      boxShadow: '0 0 8px #00fff733',
      animation: 'fade-in 0.5s',
      maxWidth: 420,
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 20, marginRight: 8 }}>💡</span>
      {tip}
    </div>
  );
};

export default LiveCoachTips;
