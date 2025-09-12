"use client";
import React from "react";

interface TronTrendChartProps {
  data: number[];
  label: string;
  color: string;
}

// Simple animated line chart for Tron scoreboard
const TronTrendChart: React.FC<TronTrendChartProps> = ({ data, label, color }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 100);
  return (
    <div style={{ width: "100%", margin: "1rem 0" }}>
      <div style={{ color, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <svg width="100%" height="48" viewBox={`0 0 ${data.length * 32} 48`} style={{ background: "#111", borderRadius: 8, boxShadow: `0 0 12px ${color}` }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={data.map((v, i) => `${i * 32},${48 - (v / max) * 40}`).join(" ")}
        />
        {data.map((v, i) => (
          <circle key={i} cx={i * 32} cy={48 - (v / max) * 40} r="4" fill={color} opacity={0.7} />
        ))}
      </svg>
    </div>
  );
};

export default TronTrendChart;
