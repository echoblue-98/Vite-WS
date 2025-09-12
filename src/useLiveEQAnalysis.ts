import { useEffect, useRef, useState } from "react";

// Returns { eqScore, tonality, startAnalysis, stopAnalysis }
export function useLiveEQAnalysis() {
  const [eqScore, setEqScore] = useState<number | null>(null);
  const [tonality, setTonality] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  function analyzeEQ() {
    if (!analyserRef.current || !dataArrayRef.current) return;
  // @ts-expect-error TypeScript type mismatch due to global types, safe for browser
  analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    // Simple EQ score: average of mid-high frequencies
    const arr = dataArrayRef.current;
    const mid = arr.slice(16, 64); // 500Hz-4kHz approx
    const avg = mid.reduce((a, b) => a + b, 0) / mid.length;
    setEqScore(Math.round(avg));
    // Tonality: simple pitch/inflection proxy (variance)
    const mean = avg;
    const variance = mid.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / mid.length;
    setTonality(Math.round(Math.sqrt(variance)));
    rafRef.current = requestAnimationFrame(analyzeEQ);
  }

  async function startAnalysis() {
    if (audioContextRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new window.AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    sourceRef.current = source;
    analyzeEQ();
  }

  function stopAnalysis() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
    sourceRef.current = null;
  }

  useEffect(() => () => stopAnalysis(), []);

  return { eqScore, tonality, startAnalysis, stopAnalysis };
}
