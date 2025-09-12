"use client";
import React, { useEffect, useRef, useState } from "react";

interface NameVerificationProps {
  onVerified: (name: string, videoBlob?: Blob) => void;
}

export default function NameVerification({ onVerified }: NameVerificationProps) {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [name, setName] = useState("");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  useEffect(() => {
    // Request camera and mic access on mount
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => setError("Camera and microphone access is required."));
    return () => {
      if (videoStream) videoStream.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = () => {
    if (!videoStream) return;
    recordedChunks.current = [];
    const recorder = new MediaRecorder(videoStream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      onVerified(name, blob);
    };
    recorder.start();
    setRecording(true);
    setTimeout(() => {
      recorder.stop();
      setRecording(false);
    }, 3000); // Record for 3 seconds
  };

  const handleVerify = () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    startRecording();
  };

  return (
    <div className="verification-overlay">
      <div className="verification-modal">
        <h2 className="glow">Welcome! Please verify your name</h2>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-preview"
          style={{ borderRadius: 16, width: 320, height: 240, background: "#111", boxShadow: "0 0 32px #00fff7" }}
        />
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Type your name and say it aloud"
          className="name-input"
          disabled={recording}
        />
        <button
          className="verify-btn"
          onClick={handleVerify}
          disabled={recording}
        >
          {recording ? "Recording..." : "Verify & Continue"}
        </button>
        {error && <p className="error-msg">{error}</p>}
      </div>
      <style jsx>{`
        .verification-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10, 20, 40, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .verification-modal {
          background: rgba(30, 40, 60, 0.95);
          border-radius: 24px;
          padding: 2.5rem 2rem 2rem 2rem;
          box-shadow: 0 0 32px #00fff7, 0 0 8px #7f5cff;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 340px;
        }
        .glow {
          color: #00fff7;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-shadow: 0 0 8px #00fff7, 0 0 16px #7f5cff;
          letter-spacing: 0.08em;
          animation: glow 1.2s infinite alternate;
        }
        @keyframes glow {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
        .name-input {
          margin: 1.2rem 0 1.2rem 0;
          padding: 0.75rem 1.2rem;
          border-radius: 8px;
          border: none;
          font-size: 1.1rem;
          background: #181f2b;
          color: #fff;
          box-shadow: 0 0 8px #00fff7;
          outline: none;
        }
        .verify-btn {
          background: linear-gradient(90deg, #00fff7 0%, #7f5cff 100%);
          color: #181f2b;
          font-weight: 700;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 2.2rem;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          box-shadow: 0 0 8px #00fff7;
          transition: background 0.2s, color 0.2s;
        }
        .verify-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-msg {
          color: #ff4d6d;
          margin-top: 0.5rem;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
