// Sparkline.tsx
// Minimal, modern sparkline for small history graphs (pitch/energy)
import React, { useState, useRef, useEffect } from "react";


// Props for Sparkline: data points, optional dimensions and color, min/max overrides

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}

export default function Sparkline({ data, width = 120, height = 24, color = "#00f0ff", min, max }: SparklineProps) {


  // Don't render if no data
  if (!data.length) return null;
  // Determine min/max for scaling
  const minValue = min !== undefined ? min : Math.min(...data);
  const maxValue = max !== undefined ? max : Math.max(...data);
  const range = maxValue - minValue || 1;
  // Tooltip state
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  // Animation state
  const [visible, setVisible] = useState(false);
  const polylineRef = useRef<SVGPolylineElement>(null);
  // Map data to SVG points
  const pointsArr = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - minValue) / range) * height;
    return { x, y, v, i };
  });
  const points = pointsArr.map(p => `${p.x},${p.y}`).join(" ");

  // Animate on mount/update
  useEffect(() => {
    setVisible(false);
    const timeout = setTimeout(() => setVisible(true), 30);
    if (polylineRef.current) {
      const len = polylineRef.current.getTotalLength();
      polylineRef.current.style.strokeDasharray = `${len}`;
      polylineRef.current.style.strokeDashoffset = `${len}`;
      setTimeout(() => {
        if (polylineRef.current) {
          polylineRef.current.style.transition = 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)';
          polylineRef.current.style.strokeDashoffset = '0';
        }
      }, 60);
    }
    return () => clearTimeout(timeout);
  }, [points]);

  return (
    <svg width={width} height={height + 24} style={{ display: "block", position: 'relative', opacity: visible ? 1 : 0, transition: 'opacity 0.7s cubic-bezier(.4,0,.2,1)' }}>
      {/* Polyline for sparkline */}
      <polyline
        ref={polylineRef}
        fill="none"
        stroke={color}
        strokeWidth={2}
        points={points}
        style={{ filter: "drop-shadow(0 0 2px #00f0ff88)" }}
      />
      {/* Dots for interactivity */}
      {pointsArr.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x}
          cy={p.y}
          r={hoverIdx === idx ? 5 : 3}
          fill={hoverIdx === idx ? color : '#222'}
          stroke={color}
          strokeWidth={1}
          style={{ cursor: 'pointer', transition: 'r 0.1s' }}
          onMouseEnter={() => setHoverIdx(idx)}
          onMouseLeave={() => setHoverIdx(null)}
        />
      ))}
      {/* Tooltip */}
      {hoverIdx !== null && (
        <g>
          <rect
            x={Math.max(0, Math.min(pointsArr[hoverIdx].x - 30, width - 60))}
            y={0}
            width={60}
            height={22}
            rx={6}
            fill="#181f2b"
            stroke={color}
            strokeWidth={1}
            opacity={0.95}
          />
          <text
            x={Math.max(0, Math.min(pointsArr[hoverIdx].x, width - 30))}
            y={16}
            textAnchor="middle"
            fontSize={13}
            fill={color}
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {`#${hoverIdx + 1}: ${pointsArr[hoverIdx].v}`}
          </text>
        </g>
      )}
    </svg>
  );
}
