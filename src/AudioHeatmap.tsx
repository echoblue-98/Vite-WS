import React from "react";

interface AudioHeatmapProps {
  audioData: number[]; // Array of amplitude or intensity values
  width?: number;
  height?: number;
}

// Simple in-house heatmap visualization for audio intensity
const AudioHeatmap: React.FC<AudioHeatmapProps> = ({ audioData, width = 400, height = 80 }) => {
  // Normalize data for color mapping
  const maxVal = Math.max(...audioData, 1);
  const minVal = Math.min(...audioData, 0);
  const colorScale = (v: number) => {
    // Map value to a blue-cyan-yellow gradient
    const pct = (v - minVal) / (maxVal - minVal);
    if (pct < 0.33) return `rgb(${Math.round(0 + pct * 255)},${Math.round(240 + pct * 15)},255)`; // blue-cyan
    if (pct < 0.66) return `rgb(${Math.round(0 + pct * 255)},255,${Math.round(255 - pct * 100)})`; // cyan-yellow
    return `rgb(255,${Math.round(255 - pct * 80)},0)`; // yellow-orange
  };
  return (
    <svg width={width} height={height} style={{ borderRadius: 12, boxShadow: "0 0 16px #00fff7cc", background: "#181f2b" }}>
      {audioData.map((val, i) => (
        <rect
          key={i}
          x={(i / audioData.length) * width}
          y={0}
          width={width / audioData.length}
          height={height}
          fill={colorScale(val)}
          opacity={0.85}
        />
      ))}
      <text x={width / 2} y={height - 8} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={600}>
        Audio Intensity Heatmap
      </text>
    </svg>
  );
};

export default AudioHeatmap;
