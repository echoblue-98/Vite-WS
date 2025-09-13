import React, { useEffect, useRef } from "react";

interface EQVisualizerProps {
  audioStream: MediaStream | null;
  isActive: boolean;
}

// Number of bars in the EQ visualization
const BAR_COUNT = 32;
// Canvas dimensions
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 60;

/**
 * EQVisualizer: Renders a live audio frequency bar visualization from a MediaStream.
 */
export default function EQVisualizer({ audioStream, isActive }: EQVisualizerProps) {
  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Animation frame ref
  const animationRef = useRef<number | undefined>(undefined);
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Use the global Uint8Array type for frequency data
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Set up audio context, analyser, and animation on stream or active change
  useEffect(() => {
    if (!audioStream || !isActive) return;
    // Create audio context and analyser
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);
    // Create data array for frequency data
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    sourceRef.current = source;

    // Draw EQ bars
    const draw = () => {
      if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
  // @ts-expect-error: Web Audio API type quirk, safe to ignore
  analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const barWidth = canvasRef.current.width / BAR_COUNT;
      for (let i = 0; i < BAR_COUNT; i++) {
        const value = dataArrayRef.current[i];
        const percent = value / 255;
        const height = canvasRef.current.height * percent;
        ctx.fillStyle = `rgba(${80 + 175 * percent},${255 * percent},255,0.8)`;
        ctx.fillRect(i * barWidth, canvasRef.current.height - height, barWidth - 2, height);
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
    // Cleanup on unmount or prop change
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioStream, isActive]);

  // Render the EQ canvas
  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ width: "100%", height: CANVAS_HEIGHT, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}
      aria-label="EQ Visualizer"
    />
  );
}
