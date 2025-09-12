import React from "react";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full mb-6">
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-3 bg-gradient-to-r from-cyan-400 via-blue-600 to-purple-700 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-gray-300 mt-1 text-center">
        Question {current + 1} of {total}
      </div>
    </div>
  );
}
