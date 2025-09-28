import { useCallback } from "react";
import { getApiUrl } from "./api";

// Fetch and play TTS preamble audio from backend
export function usePreambleAudio() {
  const playPreamble = useCallback(async (name?: string) => {
    try {
      const base = getApiUrl();
      const url = `${base}/tts/preamble${name ? `?name=${encodeURIComponent(name)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch preamble audio");
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();
      // Clean up after playback
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (err) {
      // Optionally handle error (show fallback, etc)
      // eslint-disable-next-line no-console
      console.error("Preamble audio error:", err);
    }
  }, []);
  return { playPreamble };
}