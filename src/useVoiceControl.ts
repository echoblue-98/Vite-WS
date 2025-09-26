// useVoiceControl.tsx
// React hook for voice-driven navigation and voice-to-text using browser SpeechRecognition API
// Clean, robust, and extensible for AI-enhanced interview UX

import { useEffect, useRef, useState } from "react";


export type VoiceCommandHandler = (command: string, transcript: string) => void;
export type TranscriptHandler = (text: string) => void;

export interface VoicePlugin {
  commands: string[];
  onCommand?: VoiceCommandHandler;
  onTranscript?: TranscriptHandler;
  lang?: string;
}

export interface VoiceControlOptions {
  plugins?: VoicePlugin[];
  lang?: string;
}


export function useVoiceControl({ plugins = [], lang = "en-US" }: VoiceControlOptions) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Aggregate all commands and handlers from plugins
  const allCommands = plugins.flatMap(p => p.commands);
  const pluginLangs = plugins.map(p => p.lang).filter(Boolean) as string[];
  const recognitionLang = pluginLangs.length > 0 ? pluginLangs[0] : lang;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = recognitionLang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      // Call all plugin transcript handlers
      plugins.forEach(plugin => {
        if (plugin.onTranscript) plugin.onTranscript(transcript);
      });
      // Find matching command and call plugin command handlers
      plugins.forEach(plugin => {
        const matched = plugin.commands.find(cmd => transcript.includes(cmd));
        if (matched && plugin.onCommand) plugin.onCommand(matched, transcript);
      });
    };
    recognition.onerror = (event: any) => {
      setError(event.error || "Speech recognition error");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    // Clean up
    return () => recognition.abort();
  }, [plugins, recognitionLang]);

  const start = () => {
    setError(null);
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setListening(true);
    }
  };
  const stop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  // Plugin API for extensibility
  const registerPlugin = (plugin: VoicePlugin) => {
    plugins.push(plugin);
  };

  return { listening, error, start, stop, registerPlugin };
}
