import React, { useState, useRef, useEffect } from 'react';

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
  // Backend message state
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
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

  // Fetch backend message on mount
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/';
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => setBackendMessage(data.message))
      .catch(error => console.error('Backend fetch error:', error));
  }, []);

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
      {backendMessage && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: '#fff', color: '#222', padding: '0.5em', zIndex: 1000 }}>
          Backend: {backendMessage}
        </div>
      )}
    </>
  );
};

export default ParticleBackground;
