import React from "react";


// Props for ProgressBar: current question index and total questions
interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  // Calculate percent complete
  const percent = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full mb-6">
      {/* Progress bar background */}
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        {/* Animated progress bar */}
        <div
          className="h-3 bg-gradient-to-r from-cyan-400 via-blue-600 to-purple-700 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {/* Progress text */}
      <div className="text-xs text-gray-300 mt-1 text-center">
        Question {current + 1} of {total}
      </div>
    </div>
  );
}
