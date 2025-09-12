// useTonalityInflection.ts
// Modular React hook for real-time audio feature extraction (pitch, energy, etc.)
// Uses Web Audio API. Clean, incremental, and ready for future expansion.
import { useEffect, useRef, useState } from "react";

export interface TonalityFeatures {
  pitch: number | null;
  energy: number | null;
  tonality: string;
}

export function useTonalityInflection(micStream: MediaStream | null, isRecording: boolean): TonalityFeatures {
  const [features, setFeatures] = useState<TonalityFeatures>({ pitch: null, energy: null, tonality: "Neutral" });
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!micStream || !isRecording) {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setFeatures({ pitch: null, energy: null, tonality: "Neutral" });
      return;
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    const source = ctx.createMediaStreamSource(micStream);
    sourceRef.current = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    source.connect(analyser);
    const data = new Float32Array(analyser.fftSize);

    function autoCorrelate(buf: Float32Array, sampleRate: number): number | null {
      // Basic autocorrelation pitch detection
      let SIZE = buf.length;
      let rms = 0;
      for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / SIZE);
      if (rms < 0.01) return null; // too quiet
      let r1 = 0, r2 = SIZE - 1, thres = 0.2;
      for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
      for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
      buf = buf.slice(r1, r2);
      SIZE = buf.length;
      let c = new Array(SIZE).fill(0);
      for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];
      let d = 0; while (c[d] > c[d + 1]) d++;
      let maxval = -1, maxpos = -1;
      for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
      }
      let T0 = maxpos;
      if (T0 === 0) return null;
      return sampleRate / T0;
    }

    function getFeatures() {
      analyser.getFloatTimeDomainData(data);
      // Pitch (F0)
      const pitch = autoCorrelate(data, ctx.sampleRate);
      // Energy (RMS)
      let rms = 0;
      for (let i = 0; i < data.length; i++) rms += data[i] * data[i];
      rms = Math.sqrt(rms / data.length);
      // Tonality label (simple logic, can expand)
      let tonality = "Neutral";
      if (pitch && pitch > 220) tonality = "Energetic";
      else if (pitch && pitch < 140) tonality = "Subdued";
      else if (pitch && pitch >= 140 && pitch <= 220) tonality = "Inquisitive";
      setFeatures({ pitch, energy: rms, tonality });
      rafRef.current = requestAnimationFrame(getFeatures);
    }
    rafRef.current = requestAnimationFrame(getFeatures);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      audioContextRef.current = null;
    };
  }, [micStream, isRecording]);

  return features;
}
