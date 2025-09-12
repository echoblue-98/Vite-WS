import React from "react";
import ArchetypeAlignment from "./ArchetypeAlignment";

interface SummaryScreenProps {
  responses: Array<{
    analysis: any;
    prompt: string;
  }>;
  candidateName: string;
}

export default function SummaryScreen({ responses, candidateName }: SummaryScreenProps) {
  // Find the last archetype/eqScore for summary
  const last = responses.length > 0 ? responses[responses.length - 1].analysis : null;
  return (
    <div className="bg-black bg-opacity-80 rounded-2xl shadow-2xl p-10 max-w-xl w-full flex flex-col items-center mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-center">Interview Summary</h2>
      <p className="mb-2 text-lg">Thank you, <span className="font-semibold">{candidateName}</span>!</p>
      {last && "archetype" in last && (
        <div className="mb-6 w-full">
          <ArchetypeAlignment archetype={last.archetype} eqScore={last.eqScore} />
        </div>
      )}
      <div className="w-full">
        <h3 className="font-semibold mb-2">Your Responses:</h3>
        <ul className="space-y-4">
          {responses.map((r, i) => (
            <li key={i} className="bg-gray-900 bg-opacity-60 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Q{i + 1}: {r.prompt}</div>
              <div className="text-base text-white mb-1">
                <span className="font-semibold">Transcript:</span> {r.analysis?.text ? r.analysis.text : <span className="italic text-gray-500">No transcript available</span>}
              </div>
              <div className="text-sm text-gray-300 mb-1">
                <span className="font-semibold">Sentiment:</span> {r.analysis?.sentiment_analysis_results?.[0]?.sentiment || <span className="italic">N/A</span>}
              </div>
              <div className="text-sm text-gray-300 mb-1">
                <span className="font-semibold">Emotions:</span> {r.analysis?.emotion_scores ? Object.entries(r.analysis.emotion_scores).map(([k, v]) => `${k}: ${v}`).join(", ") : <span className="italic">N/A</span>}
              </div>
              {r.analysis && "archetype" in r.analysis && (
                <ArchetypeAlignment archetype={r.analysis.archetype} eqScore={r.analysis.eqScore} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
