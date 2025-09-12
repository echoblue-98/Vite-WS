import React, { useEffect, useRef } from "react";

interface EQVisualizerProps {
  audioStream: MediaStream | null;
  isActive: boolean;
}

const BAR_COUNT = 32;

export default function EQVisualizer({ audioStream, isActive }: EQVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Use the global Uint8Array type from window to avoid type errors
  const dataArrayRef = useRef<InstanceType<typeof window.Uint8Array> | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioStream || !isActive) return;
  const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 64;
  const source = audioContext.createMediaStreamSource(audioStream);
  source.connect(analyser);
  // Correct: pass the length, not an ArrayBufferLike
  // Explicitly cast to the global Uint8Array type to avoid type errors
  const dataArray = new window.Uint8Array(analyser.frequencyBinCount);
  audioContextRef.current = audioContext;
  analyserRef.current = analyser;
  dataArrayRef.current = dataArray;
  sourceRef.current = source;

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
      if (dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      }
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
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioStream, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={60}
      style={{ width: "100%", height: 60, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}
    />
  );
}
