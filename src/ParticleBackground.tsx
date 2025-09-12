import React, { useRef, useEffect } from "react";

const NUM_PARTICLES = 60;
const COLORS = ["#00f0ff", "#0ff", "#00ff99", "#1a8cff"];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
import React, { useEffect, useState } from 'react';
}

const ParticleBackground: React.FC = () => {
// Fetch backend data on mount and store in local state
export default function ParticleBackground(props) {
  const [backendMessage, setBackendMessage] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/')
      .then(response => response.json())
      .then(data => setBackendMessage(data.message))
      .catch(error => console.error('Backend fetch error:', error));
  }, []);

  // ...existing code...
  return (
    <>
      {/* ...existing JSX... */}
      {backendMessage && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: '#fff', color: '#222', padding: '0.5em', zIndex: 1000 }}>
          Backend: {backendMessage}
        </div>
      )}
    </>
  );
}
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particles = useRef<any[]>([]);

  useEffect(() => {
    // Only run on client
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize particles after window is available
    particles.current = Array.from({ length: NUM_PARTICLES }, () => ({
      x: randomBetween(0, window.innerWidth),
      y: randomBetween(0, window.innerHeight),
      r: randomBetween(1.5, 3.5),
      dx: randomBetween(-0.4, 0.4),
      dy: randomBetween(-0.4, 0.4),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: randomBetween(0.5, 1),
    }));

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles.current) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();
        // Move
        p.x += p.dx;
        p.y += p.dy;
        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      }
      animationRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
};

export default ParticleBackground;
