import React, { useEffect, useRef, useState } from 'react';
import { getApiUrl } from './api';
// ...existing code...

// Number of animated particles
const NUM_PARTICLES = 60;
// Particle color palette
const COLORS = ["#00f0ff", "#0ff", "#00ff99", "#1a8cff"];
// Particle shadow blur
const SHADOW_BLUR = 16;
function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const ParticleBackground: React.FC = () => {
  // Backend message overlay (debug only)
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const isTest = typeof process !== 'undefined' && !!(process.env as any)?.JEST_WORKER_ID;
  // debug flag from env
  const debugOverlay = (() => {
    try {
      const metaEnv = (Function('try { return (typeof import !== "undefined" && import.meta && import.meta.env) ? import.meta.env : undefined } catch { return undefined }'))();
      if (metaEnv && (metaEnv as any).VITE_DEBUG_OVERLAY != null) {
        const v = String((metaEnv as any).VITE_DEBUG_OVERLAY);
        return ['1','true','yes','on'].includes(v.toLowerCase());
      }
    } catch {}
    if (typeof process !== 'undefined' && process.env && (process.env as any).VITE_DEBUG_OVERLAY != null) {
      const v = String((process.env as any).VITE_DEBUG_OVERLAY);
      return ['1','true','yes','on'].includes(v.toLowerCase());
    }
    return false;
  })();
  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Animation frame ref
  const animationRef = useRef<number | undefined>(undefined);
  // Particle array ref (typed)
  type Particle = {
    x: number;
    y: number;
    r: number;
    dx: number;
    dy: number;
    color: string;
    alpha: number;
  };
  const particles = useRef<Particle[]>([]);

  // Fetch backend message on mount (debug only; skip in tests)
  useEffect(() => {
    if (!debugOverlay || isTest) return;
    const apiUrl = getApiUrl();
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => setBackendMessage(data.message))
      .catch(() => {});
  }, [debugOverlay, isTest]);

  // Handle canvas drawing and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    // Initialize particles
    particles.current = Array.from({ length: NUM_PARTICLES }, () => ({
      x: randomBetween(0, window.innerWidth),
      y: randomBetween(0, window.innerHeight),
      r: randomBetween(1.5, 3.5),
      dx: randomBetween(-0.4, 0.4),
      dy: randomBetween(-0.4, 0.4),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: randomBetween(0.5, 1),
    }));

    // Resize canvas to window
    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Draw and animate particles
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
        ctx.shadowBlur = SHADOW_BLUR;
        ctx.fill();
        ctx.restore();
        // Move
        p.x += p.dx;
        p.y += p.dy;
        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      }
      animationRef.current = requestAnimationFrame(draw);
    }
    draw();
    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <>
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
      {debugOverlay && backendMessage && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: '#fff', color: '#222', padding: '0.5em', zIndex: 1000 }}>
          Backend: {backendMessage}
        </div>
      )}
    </>
  );
};

export default ParticleBackground;
