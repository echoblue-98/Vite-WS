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
  return (
    <div className={`rounded-xl p-4 shadow-lg flex items-center gap-4 ${info.color} mt-4`}>
      <span className="text-3xl">{info.icon}</span>
      <div>
        <div className="font-bold text-lg">{info.archetype}</div>
        <div className="text-sm text-gray-700">{info.description}</div>
        {typeof eqScore === "number" && (
          <div className="mt-1 text-xs text-gray-500">EQ Score: <span className="font-semibold">{eqScore}</span></div>
        )}
      </div>
    </div>
  );
}

export default ArchetypeAlignment;
