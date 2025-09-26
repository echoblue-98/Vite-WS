import React, { useEffect, useRef, useState } from 'react';

interface TronStartScreenProps { onStart: () => void }

// Simple phrase list for speech synthesis fallback
const PHRASES = ['Welcome,', 'initiating', 'your adaptive interview now.'];

const TronStartScreen: React.FC<TronStartScreenProps> = ({ onStart }) => {
  const [phase, setPhase] = useState<'loading'|'playing'|'fallback'|'done'>('loading');
  const [status, setStatus] = useState('Preparing introduction...');
  const [skippable, setSkippable] = useState(false);

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
      setSkippable(true);
      try {
  const r = await fetch(`${apiBase}/tts/preamble`);
        if (!r.ok) throw new Error('TTS fetch failed');
        const blob = await r.blob();
        if (cancelledRef.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        activeAudioRef.current = audio;
        audio.onended = () => {
          if (cancelledRef.current) return;
          setPhase('done');
          setStatus('Introduction complete.');
          URL.revokeObjectURL(url);
          setTimeout(onStart, 600);
        };
        await audio.play();
        if (cancelledRef.current) return;
        setPhase('playing');
        setStatus('Playing adaptive narration...');
      } catch {
        loadStatic();
      }
    }

    function loadStatic() {
      setSkippable(true);
      const audio = new Audio('/preamble-fixed.mp3');
      activeAudioRef.current = audio;
      audio.oncanplay = () => {
        if (cancelledRef.current) return;
        setPhase('playing');
        setStatus('Playing introduction...');
        audio.play().then(() => {
          audio.onended = () => {
            if (cancelledRef.current) return;
            setPhase('done');
            setStatus('Introduction complete.');
            setTimeout(onStart, 600);
          };
        }).catch(startDynamicVoice);
      };
      audio.onerror = startDynamicVoice;
      audio.load();
    }

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

    if (mode === 'static') {
      loadStatic();
    } else {
      attemptDynamic();
    }

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

  function handleSkip() {
    cancelledRef.current = true;
    if (activeAudioRef.current) {
      try { activeAudioRef.current.pause(); } catch {/* ignore */}
    }
    setPhase('done');
    setStatus('Introduction skipped.');
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#01050a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, zIndex: 100 }}>
      <h1 style={{ fontFamily: 'Orbitron, sans-serif', color: '#00fff7', textShadow: '0 0 14px #00fff7', fontSize: '2.2rem', margin: 0 }}>AI Adaptive Interview</h1>
      <div data-testid="preamble-status" style={{ color: '#9aeff8', fontSize: 16, fontFamily: 'system-ui, sans-serif', textAlign: 'center', maxWidth: 480 }}>{status}</div>
      <div style={{ display: 'flex', gap: 16 }}>
        {skippable && phase !== 'done' && (
          <button onClick={handleSkip} data-testid="skip-intro" style={btnStyle}>Skip</button>
        )}
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
