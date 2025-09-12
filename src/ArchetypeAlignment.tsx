import React from "react";

interface ArchetypeInfo {
  archetype: string;
  icon: string;
  description: string;
  color: string;
}

const ARCHETYPES: Record<string, ArchetypeInfo> = {
  Flynn: {
    archetype: "Flynn",
    icon: "�‍💻",
    description: "Visionary creator, innovative and adaptable. Inspires others to push boundaries and evolve.",
    color: "bg-blue-200"
  },
  Quorra: {
    archetype: "Quorra",
    icon: "⚔️",
    description: "Curious, loyal, and courageous. Embraces learning and adapts quickly to new challenges.",
    color: "bg-green-200"
  },
  Tron: {
    archetype: "Tron",
    icon: "🛡️",
    description: "Protector and leader, values justice and loyalty. Excels in roles requiring integrity and resilience.",
    color: "bg-yellow-200"
  },
  Clu: {
    archetype: "Clu",
    icon: "🤖",
    description: "Driven, perfectionist, and strategic. Thrives in high-performance, results-oriented environments.",
    color: "bg-orange-200"
  },
  Castor: {
    archetype: "Castor",
    icon: "🎭",
    description: "Charismatic, adaptable, and resourceful. Excels in communication and creative problem-solving.",
    color: "bg-purple-200"
  },
  Sam: {
    archetype: "Sam",
    icon: "🏍️",
    description: "Bold, independent, and quick-thinking. Takes initiative and adapts to fast-changing situations.",
    color: "bg-cyan-200"
  },
  // Add more Tron Legacy archetypes as needed
};

interface ArchetypeAlignmentProps {
  archetype: string;
  eqScore?: number;
}

export default function ArchetypeAlignment({ archetype, eqScore }: ArchetypeAlignmentProps) {
  const info = ARCHETYPES[archetype] || {
    archetype,
    icon: "❓",
    description: "No description available.",
    color: "bg-gray-100"
  };
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
