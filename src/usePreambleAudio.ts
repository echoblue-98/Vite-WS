import { useCallback } from "react";
import { getApiUrl } from "./api";

// Simple module-level cache to avoid re-fetching the same preamble audio
let cachedPreambleUrl: string | null = null;
let inflight: Promise<string> | null = null;

export async function prefetchPreamble(name?: string): Promise<string | null> {
  try {
    if (cachedPreambleUrl) return cachedPreambleUrl;
    if (inflight) return inflight;
    inflight = (async () => {
      const base = getApiUrl();
      const url = `${base}/tts/preamble${name ? `?name=${encodeURIComponent(name)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to prefetch preamble audio");
      const blob = await res.blob();
      cachedPreambleUrl = URL.createObjectURL(blob);
      return cachedPreambleUrl;
    })();
    return await inflight;
  } catch {
    return null;
  } finally {
    inflight = null;
  }
}

// Fetch and play TTS preamble audio from backend
export function usePreambleAudio() {
  const playPreamble = useCallback(async (name?: string) => {
    try {
      let audioUrl = cachedPreambleUrl;
      if (!audioUrl) {
        const base = getApiUrl();
        const url = `${base}/tts/preamble${name ? `?name=${encodeURIComponent(name)}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch preamble audio");
        const blob = await res.blob();
        audioUrl = URL.createObjectURL(blob);
        cachedPreambleUrl = audioUrl;
      }
      const audio = new Audio(audioUrl);
      audio.play();
      // Clean up after playback
      audio.onended = () => {
        if (audioUrl && audioUrl !== cachedPreambleUrl) {
          URL.revokeObjectURL(audioUrl);
        }
      };
    } catch (err) {
      // Optionally handle error (show fallback, etc)
      // eslint-disable-next-line no-console
      console.error("Preamble audio error:", err);
    }
  }, []);
  return { playPreamble };
}