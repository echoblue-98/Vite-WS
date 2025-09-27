import React from "react";

interface ArchetypeInfo {
  archetype: string;
  icon: string;
  description: string;
  color: string;
}

// Archetype definitions for alignment display
const ARCHETYPES: Record<string, ArchetypeInfo> = {
  "The Resonant Eye": {
    archetype: "The Resonant Eye",
    icon: "👁️",
    description: "Perceptive, emotionally attuned, and insightful. Excels at reading people and situations, making them ideal for roles requiring empathy and strategic vision.",
    color: "bg-cyan-300"
  },
  "The Discordant": {
    archetype: "The Discordant",
    icon: "⚡",
    description: "Challenger of norms, thrives in ambiguity, and brings creative disruption. Perfect for innovation, risk analysis, and roles that benefit from fresh perspectives.",
    color: "bg-indigo-400"
  },
  "Street Mage": {
    archetype: "Street Mage",
    icon: "🧙‍♂️",
    description: "Resourceful, adaptive, and street-smart. Masters of improvisation and communication, they excel in dynamic, client-facing, or negotiation-heavy roles.",
    color: "bg-pink-400"
  }
};


// Props for ArchetypeAlignment component
interface ArchetypeAlignmentProps {
  archetype: string;
  eqScore?: number;
}

const ArchetypeAlignment: React.FC<ArchetypeAlignmentProps> = ({ archetype, eqScore }) => {
  // Fallback info for unknown archetypes (must be inside function to access prop)
  const FALLBACK_INFO: ArchetypeInfo = {
    archetype,
    icon: "❓",
    description: "No description available.",
    color: "bg-gray-100"
  };
  // Get archetype info or fallback
  const info = ARCHETYPES[archetype] || FALLBACK_INFO;
  // TTS: play description aloud
  const speakDescription = () => {
    if (info.description && 'speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(info.description);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  // Animate card reveal
  const [showAnim, setShowAnim] = React.useState(false);
  React.useEffect(() => {
    setShowAnim(false);
    const t = setTimeout(() => setShowAnim(true), 30);
    return () => clearTimeout(t);
  }, [archetype, eqScore]);

  return (
    <div
      className={`rounded-xl p-4 shadow-lg flex items-center gap-4 ${info.color} mt-4`}
      style={{
        opacity: showAnim ? 1 : 0,
        transform: showAnim ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s, transform 0.5s',
      }}
    >
      <span className="text-3xl">{info.icon}</span>
      <div>
        <div className="font-bold text-lg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {info.archetype}
          <button
            onClick={speakDescription}
            style={{
              marginLeft: 4,
              background: '#7f5cff',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 0 4px #7f5cff88',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Play archetype description aloud"
          >🔊</button>
        </div>
        <div className="text-sm text-gray-700">{info.description}</div>
        {typeof eqScore === "number" && (
          <div className="mt-1 text-xs text-gray-500">EQ Score: <span className="font-semibold">{eqScore}</span></div>
        )}
      </div>
    </div>
  );
}

export default ArchetypeAlignment;
