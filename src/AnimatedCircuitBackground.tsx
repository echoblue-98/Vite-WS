"use client";
import React, { useRef, useEffect } from "react";

// Futuristic Tron-style animated circuit background using Canvas
const AnimatedCircuitBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Circuit line data
    const lines = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 120 + Math.random() * 200,
      angle: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.2,
      color: Math.random() > 0.5 ? '#00fff7' : '#7f5cff',
      glow: Math.random() > 0.5 ? '#00fff7' : '#7f5cff',
    }));

    function drawCircuit() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalAlpha = 0.7;
      for (const line of lines) {
        ctx.save();
        ctx.strokeStyle = line.color;
        ctx.shadowColor = line.glow;
        ctx.shadowBlur = 16;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(
          line.x + Math.cos(line.angle) * line.length,
          line.y + Math.sin(line.angle) * line.length
        );
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    function animate() {
      for (const line of lines) {
        line.x += Math.cos(line.angle) * line.speed;
        line.y += Math.sin(line.angle) * line.speed;
        // Wrap around screen
        if (line.x < 0 || line.x > width || line.y < 0 || line.y > height) {
          line.x = Math.random() * width;
          line.y = Math.random() * height;
        }
      }
      drawCircuit();
      animationFrameId = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animationFrameId);
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
