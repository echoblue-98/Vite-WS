"use client";
import React from "react";


// Props for TronTrendChart: data points, label, and color
interface TronTrendChartProps {
  data: number[];
  label: string;
  color: string;
}

// Simple animated line chart for Tron-style scoreboard
const TronTrendChart: React.FC<TronTrendChartProps> = ({ data, label, color }) => {
  // Don't render if no data
  if (!data.length) return null;
  // Find max value for scaling
  const max = Math.max(...data, 100);
  return (
    <div style={{ width: "100%", margin: "1rem 0" }}>
      {/* Chart label */}
      <div style={{ color, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {/* SVG line chart */}
      <svg width="100%" height="48" viewBox={`0 0 ${data.length * 32} 48`} style={{ background: "#111", borderRadius: 8, boxShadow: `0 0 12px ${color}` }}>
        {/* Polyline for trend */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={data.map((v, i) => `${i * 32},${48 - (v / max) * 40}`).join(" ")}
        />
        {/* Dots for each data point */}
        {data.map((v, i) => (
          <circle key={i} cx={i * 32} cy={48 - (v / max) * 40} r="4" fill={color} opacity={0.7} />
        ))}
      </svg>
    </div>
  );
};

export default TronTrendChart;
