import React, { useRef, useState } from "react";
import { getApiUrl } from './api';
import { SimpleWavRecorder } from "./audioRecorder";
import { useAppState } from "./context/AppStateContext";
import { useVoiceControl } from "./useVoiceControl";
import { fetchSentiment, fetchEmotion } from "./api";


// Backend-powered voice analysis demo: records audio, sends to backend, displays results
const VoiceAnalysisDemo: React.FC = () => {
  const { dispatch } = useAppState();
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [sentiment, setSentiment] = useState<string>("");
  const [emotions, setEmotions] = useState<Record<string, number> | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAnim, setShowAnim] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveFeedback, setLiveFeedback] = useState("");
  const [audioIntensity, setAudioIntensity] = useState<number[]>([]);

    useVoiceControl({
      plugins: [
        {
          commands: ['analyze voice', 'start recording'],
          onCommand: (cmd) => {
            if (cmd === 'analyze voice' || cmd === 'start recording') startRecording();
          },
          onTranscript: (t) => setLiveTranscript(t)
        },
      ],
    });

  const recorderRef = useRef<SimpleWavRecorder | null>(null);
  const finalizeRef = useRef<null | (() => Promise<void>)>(null);


    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = async () => {
      setError("");
      setResult(null);
      setLiveTranscript("");
      setLiveFeedback("");
      setAudioIntensity([]);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        // Audio intensity tracking
        const audioCtx = new window.AudioContext();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let intensityArr: number[] = [];
        function trackIntensity() {
          analyser.getByteFrequencyData(dataArray);
          // Use average of frequency bins as intensity
          const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          intensityArr.push(avg);
          setAudioIntensity([...intensityArr]);
          if (recording) requestAnimationFrame(trackIntensity);
        }
        trackIntensity();
        // ...existing code...
        const recorder = new SimpleWavRecorder();
        recorderRef.current = recorder;
        await recorder.start(stream);
        finalizeRef.current = async () => {
          await recorder.stop();
          const audioBlob = recorder.exportWav();
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.wav");
          formData.append("prompt_index", "0");
          formData.append("responses", "[]");
          setAnalysisLoading(true);
          setError("");
          setSentiment("");
          setEmotions(null);
          try {
            const res = await fetch(
              getApiUrl() + "/voice/analyze_voice",
              {
                method: "POST",
                body: formData,
              }
            );
            if (!res.ok) throw new Error("Backend error");
            const data = await res.json();
            setResult(data);
            const transcript = data.transcript || liveTranscript || "Sample candidate response.";
            setLiveTranscript(transcript);
            dispatch({ type: 'SET_VOICE_TRANSCRIPT', value: transcript });
            try {
              const sent = await fetchSentiment(transcript);
              setSentiment(sent);
            } catch (e: any) {
              setSentiment("");
            }
            try {
              const emo = await fetchEmotion(transcript);
              setEmotions(emo);
            } catch (e: any) {
              setEmotions(null);
            }
            try {
              const feedbackRes = await fetch(getApiUrl() + "/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: transcript,
                  sentiment: sentiment,
                  eq_score: data?.features?.eqScore,
                  emotion_scores: emotions,
                  voice_features: data?.features
                })
              });
              if (feedbackRes.ok) {
                const feedbackData = await feedbackRes.json();
                setLiveFeedback(feedbackData.feedback);
              }
            } catch (e: any) {
              setLiveFeedback("");
            }
            setTimeout(() => setShowAnim(true), 50);
          } catch (e: any) {
            setError("Backend error: " + e.message);
            dispatch({ type: 'SET_GLOBAL_ERROR', value: 'Backend error: ' + e.message });
          } finally {
            setAnalysisLoading(false);
          }
        };
        // emulate recording interval until stopRecording is called
        setRecording(true);
      } catch (e: any) {
        setError("Mic error: " + e.message);
        dispatch({ type: 'SET_GLOBAL_ERROR', value: 'Mic error: ' + e.message });
      }
    };

    const stopRecording = async () => {
      if (recorderRef.current) {
        const rec = recorderRef.current;
        recorderRef.current = null;
        setRecording(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        // finalize and upload
        if (finalizeRef.current) {
          const fn = finalizeRef.current;
          finalizeRef.current = null;
          await fn();
        }
      }
    };

    return (
      <div style={{ background: "#181f2b", borderRadius: 12, padding: 24, margin: "2rem 0", maxWidth: 480 }} aria-label="Voice Analysis Demo" tabIndex={0}>
        <h3 style={{ color: "#00fff7", marginBottom: 8 }}>Real-Time Voice Analysis & Feedback</h3>
        {!recording ? (
          <button
            onClick={startRecording}
            style={{ padding: "0.5em 1em", borderRadius: 8, border: "none", background: "#00fff7", color: "#222", fontWeight: "bold", cursor: "pointer" }}
            aria-label="Start recording audio for analysis"
            tabIndex={0}
          >
            Record & Analyze Voice
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{ padding: "0.5em 1em", borderRadius: 8, border: "none", background: "#ff5c5c", color: "#fff", fontWeight: "bold", cursor: "pointer" }}
            aria-label="Stop recording audio"
            tabIndex={0}
          >
            Stop Recording
          </button>
        )}
        {/* Audio Heatmap visualization during recording */}
        {recording && (
          <div style={{ margin: '1.2rem 0' }}>
            <React.Suspense fallback={<div>Loading heatmap...</div>}>
              {/* Dynamically import for code splitting, but in-house */}
              {audioIntensity.length > 0 && (
                <>
                  {/* @ts-ignore */}
                  {require('./AudioHeatmap').default && (
                    React.createElement(require('./AudioHeatmap').default, { audioData: audioIntensity, width: 400, height: 80 })
                  )}
                </>
              )}
            </React.Suspense>
          </div>
        )}
        {error && <div style={{ color: "#ff5c5c", marginTop: 12 }}>{error}</div>}
        <div style={{ marginTop: 16, color: "#e6f7ff", fontSize: 15, minHeight: 24 }}>
          <b>Live Transcript:</b> {liveTranscript || <span style={{ color: '#888' }}>No transcript yet</span>}
        </div>
        <div style={{ marginTop: 8, color: "#ffd700", fontSize: 15, minHeight: 24 }}>
          <b>Instant Feedback:</b> {liveFeedback || <span style={{ color: '#888' }}>No feedback yet</span>}
        </div>
        {(result || sentiment || emotions) && (
          <div
            style={{
              marginTop: 16,
              color: "#fff",
              background: "#181f2b",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 0 12px #00fff733",
              opacity: showAnim ? 1 : 0,
              transform: showAnim ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.5s, transform 0.5s',
            }}
            aria-live="polite"
            tabIndex={0}
          >
            <div style={{ fontWeight: 700, color: "#00fff7", marginBottom: 8 }}>Analysis Results</div>
            {result && (
              <>
                <div><b>Pitch:</b> {result.features?.pitch}</div>
                <div><b>Energy:</b> {result.features?.energy}</div>
                <div><b>Tonality:</b> {result.features?.tonality}</div>
              </>
            )}
            {sentiment && (
              <div style={{ marginTop: 8, color: "#7f5cff" }}><b>Sentiment:</b> {sentiment}</div>
            )}
            {emotions && (
              <div style={{ marginTop: 8, color: "#ffd700" }}><b>Emotions:</b> {Object.entries(emotions).map(([k, v]) => `${k}: ${v}`).join(", ")}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  export default VoiceAnalysisDemo;
