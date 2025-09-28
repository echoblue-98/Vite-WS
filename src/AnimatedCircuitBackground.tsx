"use client";
import React, { useRef, useEffect } from "react";

// Futuristic Tron-style animated circuit background using Canvas
const AnimatedCircuitBackground: React.FC = () => {
  // Canvas ref for drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  const ctx = context; // non-null alias for nested functions

    let animationFrameId: number = 0;
    let dpr = 1;
    let width = 0;
    let height = 0;

    type Line = {
      x: number;
      y: number;
      length: number;
      angle: number;
      speed: number;
      color: string;
      glow: string;
      phase: number; // per-line phase for pulsation
      osc: number;   // oscillation speed factor
      width: number; // base stroke width
    };
    let lines: Line[] = [];

    const applySize = () => {
      const oldW = width || window.innerWidth;
      const oldH = height || window.innerHeight;

      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Preserve positions relative to new size
      if (lines.length) {
        const sx = oldW ? width / oldW : 1;
        const sy = oldH ? height / oldH : 1;
        if (sx !== 1 || sy !== 1) {
          for (const line of lines) {
            line.x *= sx;
            line.y *= sy;
          }
        }
      }
    };

    applySize();

    // Circuit line data (randomized)
    lines = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 120 + Math.random() * 200,
      angle: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.2,
      color: Math.random() > 0.5 ? "#00fff7" : "#7f5cff",
      glow: Math.random() > 0.5 ? "#00fff7" : "#7f5cff",
      phase: Math.random() * Math.PI * 2,
      osc: 0.6 + Math.random() * 1.2,
      width: 1.5 + Math.random() * 2.0,
    }));

    // Draw all circuit lines
    function drawCircuit(time: number) {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      // Additive blending for a soft neon look
      ctx.globalCompositeOperation = "lighter";

      for (const line of lines) {
        const pulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(time * 0.0015 * line.osc + line.phase));
        const alpha = 0.35 + 0.45 * pulse;
        const lw = line.width * (0.8 + 0.4 * pulse);

        const x2 = line.x + Math.cos(line.angle) * line.length;
        const y2 = line.y + Math.sin(line.angle) * line.length;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = line.color;
        ctx.shadowColor = line.glow;
        ctx.shadowBlur = 10 + 10 * pulse;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Tiny spark at the tip for variation
        ctx.fillStyle = line.color;
        ctx.shadowBlur = 20 + 20 * pulse;
        ctx.beginPath();
        ctx.arc(x2, y2, 0.7 + 1.2 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // Animate circuit lines
    function animate(now: number) {
      for (const line of lines) {
        // Gentle drift to avoid perfectly straight monotone paths
        line.angle += (Math.sin(now * 0.0002 + line.phase) * 0.002);

        line.x += Math.cos(line.angle) * line.speed;
        line.y += Math.sin(line.angle) * line.speed;
        // Wrap around screen and randomize slight properties on re-entry
        if (line.x < -20 || line.x > width + 20 || line.y < -20 || line.y > height + 20) {
          line.x = Math.random() * width;
          line.y = Math.random() * height;
          line.angle = Math.random() * Math.PI * 2;
          line.phase = Math.random() * Math.PI * 2;
        }
      }
      drawCircuit(now || performance.now());
      animationFrameId = requestAnimationFrame(animate);
    }

    const onResize = () => {
      applySize();
      drawCircuit(performance.now());
    };

  animationFrameId = requestAnimationFrame(animate);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.7,
        filter: "blur(0.5px)",
      }}
      aria-hidden="true"
    />
  );
};

export default AnimatedCircuitBackground;
