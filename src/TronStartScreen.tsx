import React, { useEffect, useRef, useState } from 'react';
import { useAppState } from './context/AppStateContext';

interface TronStartScreenProps { onStart: () => void }

// Simple phrase list for speech synthesis fallback
const PHRASES = ['Welcome,', 'initiating', 'your adaptive interview now.'];

const TronStartScreen: React.FC<TronStartScreenProps> = ({ onStart }) => {
  const { state } = useAppState();
  const [phase, setPhase] = useState<'loading'|'playing'|'fallback'|'done'>('loading');
  const [status, setStatus] = useState('Preparing introduction...');
  // Skip removed by requirement

  // Track currently active audio to allow cleanup on unmount / skip
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const cancelledRef = useRef(false);

  // Resolve mode (auto|static|tts) in a test-safe manner
  let mode: string = 'auto';
  try {
    const metaEnv = (Function('try { return (typeof import !== "undefined" && import.meta && import.meta.env) ? import.meta.env : undefined } catch { return undefined }'))();
    if (metaEnv && metaEnv.VITE_PREAMBLE_MODE) {
      mode = metaEnv.VITE_PREAMBLE_MODE;
    } else if (typeof process !== 'undefined' && process.env && (process.env as any).VITE_PREAMBLE_MODE) {
      mode = (process.env as any).VITE_PREAMBLE_MODE as string;
    }
  } catch {/* ignore */}

  // Resolve API base consistently with the rest of the app: VITE_API_URL -> process.env -> localhost
  let apiBase = 'http://localhost:8000';
  try {
    const metaEnv = (Function('try { return (typeof import !== "undefined" && import.meta && import.meta.env) ? import.meta.env : undefined } catch { return undefined }'))();
    if (metaEnv && metaEnv.VITE_API_URL) apiBase = metaEnv.VITE_API_URL as string;
    else if (typeof process !== 'undefined' && process.env && (process.env as any).VITE_API_URL) apiBase = (process.env as any).VITE_API_URL as string;
  } catch {/* ignore */}
  // ensure no trailing slash conflicts in fetch path joining
  apiBase = (apiBase || '').replace(/\/$/, '');

  // Optional overrides for voice/script via env
  let defaultVoiceId: string | undefined;
  let defaultModelId: string | undefined;
  let defaultScript: string | undefined;
  try {
    const metaEnv = (Function('try { return (typeof import !== "undefined" && import.meta && import.meta.env) ? import.meta.env : undefined } catch { return undefined }'))();
    defaultVoiceId = metaEnv?.VITE_PREAMBLE_VOICE_ID as string | undefined;
    defaultModelId = metaEnv?.VITE_PREAMBLE_MODEL_ID as string | undefined;
    defaultScript = metaEnv?.VITE_PREAMBLE_SCRIPT as string | undefined;
  } catch {/* ignore */}

  useEffect(() => {
    cancelledRef.current = false;
    const isTestEnv = typeof (globalThis as any).jest !== 'undefined' ||
      (typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID);
    if (isTestEnv) {
      setStatus('Test mode: narration skipped. Click Start to continue.');
      setPhase('done');
      return () => { cancelledRef.current = true; };
    }

    async function attemptDynamic() {
      setStatus('Requesting adaptive narration...');
      try {
    const params = new URLSearchParams();
    if (state?.candidateName) params.set('name', state.candidateName);
    if (defaultVoiceId) params.set('voice_id', defaultVoiceId);
    if (defaultModelId) params.set('model_id', defaultModelId);
    if (defaultScript) params.set('script', defaultScript);
  const ttsUrl = `${apiBase}/tts/preamble${params.toString() ? `?${params.toString()}` : ''}`;
  const r = await fetch(ttsUrl);
        if (!r.ok) throw new Error('TTS fetch failed');
        const blob = await r.blob();
        if (cancelledRef.current) return;
        const objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        activeAudioRef.current = audio;
        audio.onended = () => {
          if (cancelledRef.current) return;
          setPhase('done');
          setStatus('Introduction complete.');
          URL.revokeObjectURL(objectUrl);
          setTimeout(onStart, 600);
        };
        await audio.play();
        if (cancelledRef.current) return;
        setPhase('playing');
        setStatus('Playing adaptive narration...');
      } catch {
        // Do NOT use static audio fallback; go to live synthesis fallback
        startDynamicVoice();
      }
    }

    // Removed static MP3 fallback per requirement

    function startDynamicVoice() {
      if (cancelledRef.current || phase === 'fallback' || phase === 'done') return;
      setPhase('fallback');
      setStatus('Adaptive live voice engaged...');
      speakAdaptive(PHRASES, () => {
        if (cancelledRef.current) return;
        setPhase('done');
        setStatus('Introduction complete.');
        setTimeout(onStart, 500);
      });
    }

    // Prefer TTS; if it fails, use web-speech fallback
    attemptDynamic();

    return () => {
      cancelledRef.current = true;
      if (activeAudioRef.current) {
        try { activeAudioRef.current.pause(); } catch {/* ignore */}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    const synth = window.speechSynthesis;
    const list = synth.getVoices();
    if (!list.length) return [];
    const prioritized = list.filter(v => /male|narrator|adam|brian|guy|matt|baritone|voice/i.test(v.name));
    const fallbacks = list.filter(v => !prioritized.includes(v));
    return [...prioritized, ...fallbacks];
  }

  function speakAdaptive(lines: string[], onDone: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) { onDone(); return; }
    const synth = window.speechSynthesis;
    const voices = chooseVoices();
    if (!voices.length) {
      window.setTimeout(() => speakAdaptive(lines, onDone), 300);
      return;
    }
    let idx = 0;
    const speakNext = () => {
      if (cancelledRef.current) return;
      if (idx >= lines.length) { onDone(); return; }
      const utter = new SpeechSynthesisUtterance(lines[idx]);
      utter.voice = voices[idx % voices.length];
      utter.rate = 1.0;
      utter.pitch = 0.9;
      utter.onend = () => {
        idx += 1;
        speakNext();
      };
      try { synth.speak(utter); } catch { onDone(); }
    };
    speakNext();
  }

  // Skip removed

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#01050a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, zIndex: 100 }}>
      <h1 style={{ fontFamily: 'Orbitron, sans-serif', color: '#00fff7', textShadow: '0 0 14px #00fff7', fontSize: '2.2rem', margin: 0 }}>AI Adaptive Interview</h1>
      <div data-testid="preamble-status" style={{ color: '#9aeff8', fontSize: 16, fontFamily: 'system-ui, sans-serif', textAlign: 'center', maxWidth: 480 }}>{status}</div>
      <div style={{ display: 'flex', gap: 16 }}>
        {phase === 'done' && (
          <button onClick={onStart} data-testid="start-interview" style={btnStyle}>Start Interview</button>
        )}
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  background: '#00fff7',
  color: '#062c31',
  fontWeight: 700,
  fontSize: 16,
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderRadius: 14,
  cursor: 'pointer',
  boxShadow: '0 0 0 1px #00fff7, 0 0 18px #00fff7aa',
  fontFamily: 'system-ui, sans-serif'
};

export default TronStartScreen;
